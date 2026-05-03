const pool = require('../config/db');

// ---------------------------------------------------------------------------
// Shared enriched SELECT
// ---------------------------------------------------------------------------
// The schema has sale_listings and lease_listings as separate tables.
// favorites carries sale_listing_id and lease_listing_id as separate nullable
// FKs with a CHECK constraint ensuring exactly one is set per row.
// We LEFT JOIN both tables and COALESCE shared columns so one query covers
// both listing types.
// ---------------------------------------------------------------------------

const FAVORITES_QUERY = `
  SELECT
    f.id                                        AS favorite_id,
    f.created_at                                AS favorited_at,
    f.sale_listing_id,
    f.lease_listing_id,

    COALESCE(sl.id,          ll.id)          AS listing_db_id,
    COALESCE(sl.title,       ll.title)       AS title,
    COALESCE(sl.price,       ll.price)       AS price,
    COALESCE(sl.category,    ll.category)    AS category,
    COALESCE(sl.condition,   ll.condition)   AS condition,
    COALESCE(sl.location,    ll.location)    AS location,
    COALESCE(sl.image_url,   ll.image_url)   AS image_url,
    COALESCE(sl.description, ll.description) AS description,
    COALESCE(sl.is_verified, ll.is_verified) AS is_verified,
    COALESCE(sl.seller_id,   ll.seller_id)   AS seller_id,

    -- Type tag so the client knows which kind of listing this is
    CASE WHEN f.sale_listing_id IS NOT NULL THEN 'SALE' ELSE 'LEASE' END AS type,

    -- LEASE-only fields (NULL for SALE rows)
    ll.price_unit,
    ll.available_from,
    ll.available_until,
    ll.min_duration,
    ll.max_duration,

    -- Seller info
    u.name         AS seller_name,
    u.role         AS seller_role,
    u.rating       AS seller_rating,
    u.avatar_url   AS seller_avatar,
    u.is_verified  AS seller_verified

  FROM favorites f
  LEFT JOIN sale_listings  sl ON f.sale_listing_id  = sl.id
  LEFT JOIN lease_listings ll ON f.lease_listing_id = ll.id
  JOIN  users u ON COALESCE(sl.seller_id, ll.seller_id) = u.id
  WHERE f.user_id = $1
  ORDER BY f.created_at DESC
`;

// ---------------------------------------------------------------------------
// Format helper
// ---------------------------------------------------------------------------

const formatFavorite = (row) => ({
  favoriteId:   String(row.favorite_id),
  listingId:    String(row.listing_db_id),
  type:         row.type,
  title:        row.title,
  price:        parseFloat(row.price),
  priceUnit:    row.price_unit    ?? undefined,
  category:     row.category,
  condition:    row.condition,
  location:     row.location,
  imageUrl:     row.image_url     ?? undefined,
  isVerified:   row.is_verified,
  description:  row.description,
  favoritedAt:  row.favorited_at,
  // LEASE availability window (undefined for SALE rows)
  availableFrom:  row.available_from  ?? undefined,
  availableUntil: row.available_until ?? undefined,
  minDuration:    row.min_duration    ?? undefined,
  maxDuration:    row.max_duration    ?? undefined,
  seller: {
    name:       row.seller_name,
    role: row.seller_role,
    rating:     parseFloat(row.seller_rating) || 0,
    avatarUrl:  row.seller_avatar  ?? undefined,
    isVerified: row.seller_verified,
  },
});

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

/**
 * GET /api/favorites
 * Returns all favorited listings (both SALE and LEASE) for the current user.
 */
const getFavorites = async (req, res) => {
  try {
    const { rows } = await pool.query(FAVORITES_QUERY, [req.user.id]);
    return res.json({ success: true, favorites: rows.map(formatFavorite) });
  } catch (err) {
    console.error('getFavorites error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * POST /api/favorites/:type/:listingId
 * Add a listing to favorites.
 *
 * :type      — 'sale' or 'lease'
 * :listingId — the id of the listing in the corresponding table
 *
 * Uses ON CONFLICT DO NOTHING so hitting the endpoint twice is safe.
 */
const addFavorite = async (req, res) => {
  try {
    const { type, listingId } = req.params;
    const isSale = type === 'sale';

    // Verify the listing actually exists in the correct table
    const table = isSale ? 'sale_listings' : 'lease_listings';
    const { rows } = await pool.query(
      `SELECT id FROM ${table} WHERE id = $1`,
      [listingId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    // Insert with the correct FK column; the other stays NULL
    await pool.query(
      `INSERT INTO favorites (user_id, sale_listing_id, lease_listing_id)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [
        req.user.id,
        isSale ? listingId : null,
        isSale ? null : listingId,
      ],
    );

    return res.status(201).json({ success: true, message: 'Added to favorites.' });
  } catch (err) {
    console.error('addFavorite error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * DELETE /api/favorites/:type/:listingId
 * Remove a listing from favorites.
 *
 * :type      — 'sale' or 'lease'
 * :listingId — the id of the listing in the corresponding table
 */
const removeFavorite = async (req, res) => {
  try {
    const { type, listingId } = req.params;
    const isSale = type === 'sale';

    const column = isSale ? 'sale_listing_id' : 'lease_listing_id';

    const { rowCount } = await pool.query(
      `DELETE FROM favorites WHERE user_id = $1 AND ${column} = $2`,
      [req.user.id, listingId],
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Favorite not found.' });
    }

    return res.json({ success: true, message: 'Removed from favorites.' });
  } catch (err) {
    console.error('removeFavorite error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getFavorites, addFavorite, removeFavorite };