const pool = require('../config/db');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
const getStats = async (req, res) => {
  try {
    const [users, listings, orders, revenue] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM listings'),
      pool.query('SELECT COUNT(*) FROM orders'),
      pool.query("SELECT COALESCE(SUM(amount), 0) FROM orders WHERE status = 'completed'"),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(users.rows[0].count),
        totalListings: parseInt(listings.rows[0].count),
        totalOrders: parseInt(orders.rows[0].count),
        totalRevenue: parseFloat(revenue.rows[0].coalesce),
      },
    });
  } catch (err) {
    console.error('GetStats error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT id, name, email, role, is_verified, faculty, rating, total_sales, active_listings, created_at FROM users`;
    const values = [];

    if (search) {
      query += ` WHERE name ILIKE $1 OR email ILIKE $1`;
      values.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, values);
    res.json({ success: true, users: result.rows });
  } catch (err) {
    console.error('GetAllUsers error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Verify a user
// @route   PUT /api/admin/users/:id/verify
// @access  Admin
const verifyUser = async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE users SET is_verified = true WHERE id = $1 RETURNING id, name, email, is_verified',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, message: 'User verified.', user: result.rows[0] });
  } catch (err) {
    console.error('VerifyUser error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    console.error('DeleteUser error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get all listings (admin view)
// @route   GET /api/admin/listings
// @access  Admin
const getAllListings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, u.name AS seller_name, u.email AS seller_email
       FROM listings l JOIN users u ON l.seller_id = u.id
       ORDER BY l.created_at DESC`
    );
    res.json({ success: true, listings: result.rows });
  } catch (err) {
    console.error('GetAllListings error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Verify a listing
// @route   PUT /api/admin/listings/:id/verify
// @access  Admin
const verifyListing = async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE listings SET is_verified = true WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    res.json({ success: true, message: 'Listing verified.', listing: result.rows[0] });
  } catch (err) {
    console.error('VerifyListing error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getStats, getAllUsers, verifyUser, deleteUser, getAllListings, verifyListing };
