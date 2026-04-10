const pool = require('../config/db');

// @desc    Get all conversations for logged-in user
// @route   GET /api/chats
// @access  Private
const getConversations = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
        -- Listing info
        l.title AS listing_title, l.image_url AS listing_thumb,
        -- Other participant info
        CASE WHEN c.buyer_id = $1 THEN seller.name ELSE buyer.name END AS participant_name,
        CASE WHEN c.buyer_id = $1 THEN seller.avatar_url ELSE buyer.avatar_url END AS participant_avatar,
        CASE WHEN c.buyer_id = $1 THEN seller.is_verified ELSE buyer.is_verified END AS participant_verified,
        -- Unread count
        (SELECT COUNT(*) FROM messages m
         WHERE m.conversation_id = c.id AND m.is_read = false AND m.sender_id != $1) AS unread_count
       FROM conversations c
       JOIN users buyer ON c.buyer_id = buyer.id
       JOIN users seller ON c.seller_id = seller.id
       LEFT JOIN listings l ON c.listing_id = l.id
       WHERE c.buyer_id = $1 OR c.seller_id = $1
       ORDER BY c.last_message_at DESC`,
      [req.user.id]
    );

    // Format to match Conversation type in frontend
    const conversations = result.rows.map((row) => ({
      id: String(row.id),
      participant: {
        name: row.participant_name,
        avatarUrl: row.participant_avatar,
        isOnline: false, // can be updated with socket.io later
        isStore: row.participant_verified,
      },
      lastMessage: row.last_message || '',
      timestamp: row.last_message_at,
      unreadCount: parseInt(row.unread_count) || 0,
      listingThumb: row.listing_thumb || '',
      type: row.type || 'BUYING',
    }));

    res.json({ success: true, conversations });
  } catch (err) {
    console.error('GetConversations error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get or create a conversation for a listing
// @route   POST /api/chats/start
// @access  Private
const startConversation = async (req, res) => {
  try {
    const { listing_id } = req.body;

    if (!listing_id) {
      return res.status(400).json({ success: false, message: 'listing_id is required.' });
    }

    const listing = await pool.query('SELECT * FROM listings WHERE id = $1', [listing_id]);
    if (listing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    const seller_id = listing.rows[0].seller_id;
    const type = listing.rows[0].type === 'LEASE' ? 'LEASING' : 'BUYING';

    if (seller_id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot start a conversation with yourself.' });
    }

    // Get or create conversation
    let conversation = await pool.query(
      'SELECT * FROM conversations WHERE buyer_id = $1 AND seller_id = $2 AND listing_id = $3',
      [req.user.id, seller_id, listing_id]
    );

    if (conversation.rows.length === 0) {
      conversation = await pool.query(
        `INSERT INTO conversations (buyer_id, seller_id, listing_id, type)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [req.user.id, seller_id, listing_id, type]
      );
    }

    res.json({ success: true, conversation: conversation.rows[0] });
  } catch (err) {
    console.error('StartConversation error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get messages in a conversation
// @route   GET /api/chats/:conversationId/messages
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify user is part of this conversation
    const conv = await pool.query(
      'SELECT * FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
      [conversationId, req.user.id]
    );

    if (conv.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const result = await pool.query(
      `SELECT m.*, u.name AS sender_name, u.avatar_url AS sender_avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [conversationId]
    );

    // Mark messages as read
    await pool.query(
      'UPDATE messages SET is_read = true WHERE conversation_id = $1 AND sender_id != $2',
      [conversationId, req.user.id]
    );

    // Format to match Message type in frontend
    const messages = result.rows.map((row) => ({
      id: String(row.id),
      text: row.text,
      sender: row.sender_id === req.user.id ? 'me' : 'them',
      timestamp: row.created_at,
      senderName: row.sender_name,
      senderAvatar: row.sender_avatar,
    }));

    res.json({ success: true, messages });
  } catch (err) {
    console.error('GetMessages error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Send a message
// @route   POST /api/chats/:conversationId/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    // Verify user is part of this conversation
    const conv = await pool.query(
      'SELECT * FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
      [conversationId, req.user.id]
    );

    if (conv.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // Insert message
    const result = await pool.query(
      'INSERT INTO messages (conversation_id, sender_id, text) VALUES ($1, $2, $3) RETURNING *',
      [conversationId, req.user.id, text.trim()]
    );

    // Update last message in conversation
    await pool.query(
      'UPDATE conversations SET last_message = $1, last_message_at = NOW() WHERE id = $2',
      [text.trim(), conversationId]
    );

    const message = result.rows[0];

    res.status(201).json({
      success: true,
      message: {
        id: String(message.id),
        text: message.text,
        sender: 'me',
        timestamp: message.created_at,
      },
    });
  } catch (err) {
    console.error('SendMessage error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getConversations, startConversation, getMessages, sendMessage };
