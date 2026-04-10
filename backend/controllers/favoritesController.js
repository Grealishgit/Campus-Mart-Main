const pool = require('../config/db');

// @desc    Get user's favorite listings
// @route   GET /api/favorites
// @access  Private
const getFavorites = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, u.name AS seller_name, u.rating AS seller_rating,
              u.avatar_url AS seller_avatar, u.is_verified AS seller_verified,
              f.created_at AS favorited_at
       FROM favorites f
       JOIN listings l ON f.listing_id = l.id
       JOIN users u ON l.seller_id = u.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );

    const favorites = result.rows.map((row) => ({
      id: String(row.id),
      title: row.title,
      price: parseFloat(row.price),
      priceUnit: row.price_unit || undefined,
      type: row.type,
      category: row.category,
      condition: row.condition,
      location: row.location,
      imageUrl: row.image_url,
      isVerified: row.is_verified,
      description: row.description,
      favoritedAt: row.favorited_at,
      seller: {
        name: row.seller_name,
        rating: parseFloat(row.seller_rating) || 0,
        avatarUrl: row.seller_avatar,
        isVerified: row.seller_verified,
      },
    }));

    res.json({ success: true, favorites });
  } catch (err) {
    console.error('GetFavorites error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Add listing to favorites
// @route   POST /api/favorites/:listingId
// @access  Private
const addFavorite = async (req, res) => {
  try {
    const { listingId } = req.params;

    const listing = await pool.query('SELECT id FROM listings WHERE id = $1', [listingId]);
    if (listing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    await pool.query(
      'INSERT INTO favorites (user_id, listing_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, listingId]
    );

    res.json({ success: true, message: 'Added to favorites.' });
  } catch (err) {
    console.error('AddFavorite error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Remove listing from favorites
// @route   DELETE /api/favorites/:listingId
// @access  Private
const removeFavorite = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND listing_id = $2',
      [req.user.id, req.params.listingId]
    );

    res.json({ success: true, message: 'Removed from favorites.' });
  } catch (err) {
    console.error('RemoveFavorite error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getFavorites, addFavorite, removeFavorite };
