const pool = require('../config/db');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Derive the conversation type from the listing type.
 * Schema CHECK: type IN ('BUYING', 'SELLING', 'LEASING')
 */
const conversationType = (listingType) =>
  listingType === 'LEASE' ? 'LEASING' : 'BUYING';

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

/**
 * GET /api/chats
 * All conversations the current user is part of (as buyer or seller).
 *
 * Schema note: conversations has sale_listing_id and lease_listing_id as
 * separate nullable FKs — no single listing_id column exists.
 */
const getConversations = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
        SELECT
          c.*,

          -- Listing info: COALESCE across both listing tables
          COALESCE(sl.title,     ll.title)     AS listing_title,
          COALESCE(sl.image_url, ll.image_url) AS listing_thumb,

          -- Other participant
          CASE WHEN c.buyer_id = $1 THEN seller.name       ELSE buyer.name       END AS participant_name,
          CASE WHEN c.buyer_id = $1 THEN seller.avatar_url ELSE buyer.avatar_url END AS participant_avatar,
          CASE WHEN c.buyer_id = $1 THEN seller.is_verified ELSE buyer.is_verified END AS participant_verified,

          -- Unread messages sent by the other person
          (
            SELECT COUNT(*)
            FROM messages m
            WHERE m.conversation_id = c.id
              AND m.is_read  = false
              AND m.sender_id != $1
          ) AS unread_count

        FROM conversations c
        JOIN  users buyer  ON c.buyer_id  = buyer.id
        JOIN  users seller ON c.seller_id = seller.id
        LEFT JOIN sale_listings  sl ON c.sale_listing_id  = sl.id
        LEFT JOIN lease_listings ll ON c.lease_listing_id = ll.id
        WHERE c.buyer_id = $1 OR c.seller_id = $1
        ORDER BY c.last_message_at DESC
      `,
      [req.user.id],
    );

    const conversations = rows.map((row) => ({
      id:           String(row.id),
      type:         row.type || 'BUYING',
      lastMessage:  row.last_message  || '',
      timestamp:    row.last_message_at,
      unreadCount:  parseInt(row.unread_count, 10) || 0,
      listingThumb: row.listing_thumb  || '',
      listingTitle: row.listing_title  || '',
      participant: {
        name:       row.participant_name,
        avatarUrl:  row.participant_avatar   ?? undefined,
        isVerified: row.participant_verified,
        isOnline:   false, // extend via socket.io when ready
      },
    }));

    return res.json({ success: true, conversations });
  } catch (err) {
    console.error('getConversations error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * POST /api/chats/start
 * Get or create a conversation for a listing.
 *
 * Body: { type: 'sale' | 'lease', listing_id: number }
 *
 * We need `type` in the body because the listing lives in either
 * sale_listings or lease_listings — there is no unified listings table.
 */
const startConversation = async (req, res) => {
  try {
    const { type, listing_id } = req.body;
    const isSale = type === 'sale';

    // Fetch from the correct listing table
    const table = isSale ? 'sale_listings' : 'lease_listings';
    const { rows: listingRows } = await pool.query(
      `SELECT id, seller_id FROM ${table} WHERE id = $1`,
      [listing_id],
    );

    if (listingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    const listing   = listingRows[0];
    const sellerId  = listing.seller_id;
    const convType  = isSale ? 'BUYING' : 'LEASING';
    const saleId    = isSale ? listing_id : null;
    const leaseId   = isSale ? null : listing_id;

    if (sellerId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot start a conversation with yourself.' });
    }

    // Look for an existing conversation for this buyer + seller + listing
    const fkColumn  = isSale ? 'sale_listing_id' : 'lease_listing_id';
    const { rows: existing } = await pool.query(
      `SELECT * FROM conversations
       WHERE buyer_id = $1 AND seller_id = $2 AND ${fkColumn} = $3`,
      [req.user.id, sellerId, listing_id],
    );

    if (existing.length > 0) {
      return res.json({ success: true, conversation: existing[0] });
    }

    // Create a new conversation
    const { rows: created } = await pool.query(
      `INSERT INTO conversations
         (buyer_id, seller_id, sale_listing_id, lease_listing_id, type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, sellerId, saleId, leaseId, convType],
    );

    return res.status(201).json({ success: true, conversation: created[0] });
  } catch (err) {
    console.error('startConversation error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * GET /api/chats/:conversationId/messages
 * Paginated messages for a conversation the current user is part of.
 * Marks fetched messages as read after returning them.
 *
 * Query params: page (default 1), limit (default 50, max 100)
 */
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const offset = (page - 1) * limit;

    // Verify the current user belongs to this conversation
    const { rows: convRows } = await pool.query(
      'SELECT * FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
      [conversationId, req.user.id],
    );

    if (convRows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // Fetch paginated messages
    const { rows: messageRows } = await pool.query(
      `
        SELECT m.*, u.name AS sender_name, u.avatar_url AS sender_avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at ASC
        LIMIT $2 OFFSET $3
      `,
      [conversationId, limit, offset],
    );

    // Get total count for pagination metadata
    const { rows: countRows } = await pool.query(
      'SELECT COUNT(*) FROM messages WHERE conversation_id = $1',
      [conversationId],
    );
    const total = parseInt(countRows[0].count, 10);

    // Mark the other person's messages as read (fire-and-forget — doesn't block response)
    pool.query(
      'UPDATE messages SET is_read = true WHERE conversation_id = $1 AND sender_id != $2 AND is_read = false',
      [conversationId, req.user.id],
    ).catch((err) => console.error('markRead error:', err));

    const messages = messageRows.map((row) => ({
      id:           String(row.id),
      text:         row.text,
      sender:       row.sender_id === req.user.id ? 'me' : 'them',
      timestamp:    row.created_at,
      isRead:       row.is_read,
      senderName:   row.sender_name,
      senderAvatar: row.sender_avatar ?? undefined,
    }));

    return res.json({
      success: true,
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + messageRows.length < total,
      },
    });
  } catch (err) {
    console.error('getMessages error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * POST /api/chats/:conversationId/messages
 * Send a message to a conversation the current user is part of.
 */
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const text = (req.body.text || '').trim();

    if (!text) {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    // Verify the current user belongs to this conversation
    const { rows: convRows } = await pool.query(
      'SELECT id FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
      [conversationId, req.user.id],
    );

    if (convRows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // Insert message and update conversation's last_message in one round-trip
    const [{ rows: msgRows }] = await Promise.all([
      pool.query(
        'INSERT INTO messages (conversation_id, sender_id, text) VALUES ($1, $2, $3) RETURNING *',
        [conversationId, req.user.id, text],
      ),
      pool.query(
        'UPDATE conversations SET last_message = $1, last_message_at = NOW() WHERE id = $2',
        [text, conversationId],
      ),
    ]);

    const msg = msgRows[0];

    return res.status(201).json({
      success: true,
      message: {
        id:        String(msg.id),
        text:      msg.text,
        sender:    'me',
        timestamp: msg.created_at,
      },
    });
  } catch (err) {
    console.error('sendMessage error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getConversations, startConversation, getMessages, sendMessage };