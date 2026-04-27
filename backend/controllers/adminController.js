const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const getListingsStorage = async () => {
  const result = await pool.query(`
    SELECT
      to_regclass('public.listings') AS listings_table,
      to_regclass('public.sale_listings') AS sale_listings_table,
      to_regclass('public.lease_listings') AS lease_listings_table
  `);

  const row = result.rows[0] || {};
  return {
    hasUnifiedListings: Boolean(row.listings_table),
    hasSaleListings: Boolean(row.sale_listings_table),
    hasLeaseListings: Boolean(row.lease_listings_table),
  };
};



// Admin controller for logging in
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      await createLog('warning', `Failed login attempt for email: ${email}`, 'loginAdmin');
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    if (user.role !== 'admin') {
      await createLog('warning', `Non-admin login attempt: ${email}`, 'loginAdmin');
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await createLog('warning', `Wrong password for admin: ${email}`, 'loginAdmin');
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user.id);
    const { password: _, ...adminWithoutPassword } = user;

    await createLog('success', `Admin logged in: ${email}`, 'loginAdmin', user.id);

    return res.json({
      success: true,
      message: 'Admin login successful.',
      token,
      user: adminWithoutPassword,
    });
  } catch (error) {
    await createLog('error', `Admin login error: ${error.message}`, 'loginAdmin');
    console.error('Admin login error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during admin login.' });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
const getStats = async (req, res) => {
  try {
    const storage = await getListingsStorage();

    const [users, orders, revenue] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM orders'),
      pool.query("SELECT COALESCE(SUM(amount), 0) FROM orders WHERE status = 'completed'"),
    ]);

    let totalListings = 0;

    if (storage.hasUnifiedListings) {
      const listings = await pool.query('SELECT COUNT(*) FROM listings');
      totalListings = parseInt(listings.rows[0].count, 10);
    } else {
      const [saleListings, leaseListings] = await Promise.all([
        storage.hasSaleListings
          ? pool.query('SELECT COUNT(*) FROM sale_listings')
          : Promise.resolve({ rows: [{ count: '0' }] }),
        storage.hasLeaseListings
          ? pool.query('SELECT COUNT(*) FROM lease_listings')
          : Promise.resolve({ rows: [{ count: '0' }] }),
      ]);

      totalListings =
        parseInt(saleListings.rows[0].count, 10) +
        parseInt(leaseListings.rows[0].count, 10);
    }

    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(users.rows[0].count),
        totalListings,
        totalOrders: parseInt(orders.rows[0].count),
        totalRevenue: parseFloat(revenue.rows[0].coalesce),
      },
    });
  } catch (err) {
    console.error('GetStats error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};


// get all orders
// Add this function in adminController.js before the module.exports

const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT
        o.id, o.type, o.amount, o.status, o.created_at,
        o.lease_start, o.lease_end,
        buyer.name        AS buyer_name,
        buyer.email       AS buyer_email,
        seller.name       AS seller_name,
        seller.email      AS seller_email,
        COALESCE(sl.title, ll.title) AS item_title
       FROM orders o
       LEFT JOIN users buyer   ON o.buyer_id         = buyer.id
       LEFT JOIN users seller  ON o.seller_id        = seller.id
       LEFT JOIN sale_listings  sl ON o.sale_listing_id  = sl.id
       LEFT JOIN lease_listings ll ON o.lease_listing_id = ll.id
       ORDER BY o.created_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), parseInt(offset)]
    );

    res.json({ success: true, orders: result.rows });
  } catch (err) {
    console.error('GetOrders error:', err.message);
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

    const user = result.rows[0];
    await createLog('success', `User verified: ${user.email}`, 'verifyUser', req.params.id);

    res.json({ success: true, message: 'User verified.', user });
  } catch (err) {
    await createLog('error', `verifyUser error: ${err.message}`, 'verifyUser');
    console.error('VerifyUser error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
  try {
    const check = await pool.query('SELECT name, email FROM users WHERE id = $1', [req.params.id]);
    const user = check.rows[0];

    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);

    await createLog('warning', `User deleted: ${user?.email ?? req.params.id}`, 'deleteUser');

    res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    await createLog('error', `deleteUser error: ${err.message}`, 'deleteUser');
    console.error('DeleteUser error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get all listings (admin view)
// @route   GET /api/admin/listings
// @access  Admin
const getAllListings = async (req, res) => {
  try {
    const storage = await getListingsStorage();

    if (storage.hasUnifiedListings) {
      const result = await pool.query(
        `SELECT l.*, u.name AS seller_name, u.email AS seller_email
         FROM listings l JOIN users u ON l.seller_id = u.id
         ORDER BY l.created_at DESC`
      );
      return res.json({ success: true, listings: result.rows });
    }

    const [saleRows, leaseRows] = await Promise.all([
      storage.hasSaleListings
        ? pool.query(
          `SELECT
               s.id,
               s.title,
               s.category,
               'SALE' AS type,
               s.price,
               s.is_verified,
               s.is_available,
               u.name AS seller_name,
               u.email AS seller_email,
               s.created_at
             FROM sale_listings s
             JOIN users u ON s.seller_id = u.id`
        )
        : Promise.resolve({ rows: [] }),
      storage.hasLeaseListings
        ? pool.query(
          `SELECT
               l.id,
               l.title,
               l.category,
               'LEASE' AS type,
               l.price,
               l.is_verified,
               l.is_available,
               u.name AS seller_name,
               u.email AS seller_email,
               l.created_at
             FROM lease_listings l
             JOIN users u ON l.seller_id = u.id`
        )
        : Promise.resolve({ rows: [] }),
    ]);

    const listings = [...saleRows.rows, ...leaseRows.rows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    res.json({ success: true, listings });
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
    const storage = await getListingsStorage();
    const listingId = req.params.id;
    const listingType = typeof req.query.type === 'string'
      ? req.query.type.toUpperCase()
      : null;

    if (storage.hasUnifiedListings) {
      const result = await pool.query(
        'UPDATE listings SET is_verified = true WHERE id = $1 RETURNING *',
        [listingId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Listing not found.' });
      }

      await createLog('success', `Listing verified: ${result.rows[0].title} (ID: ${listingId})`, 'verifyListing');
      return res.json({ success: true, message: 'Listing verified.', listing: result.rows[0] });
    }

    const updateSaleListing = async () => pool.query(
      'UPDATE sale_listings SET is_verified = true WHERE id = $1 RETURNING *',
      [listingId]
    );
    const updateLeaseListing = async () => pool.query(
      'UPDATE lease_listings SET is_verified = true WHERE id = $1 RETURNING *',
      [listingId]
    );

    let result = { rows: [] };

    if (listingType === 'SALE' && storage.hasSaleListings) {
      result = await updateSaleListing();
    } else if (listingType === 'LEASE' && storage.hasLeaseListings) {
      result = await updateLeaseListing();
    } else {
      if (storage.hasSaleListings) result = await updateSaleListing();
      if (!result.rows.length && storage.hasLeaseListings) result = await updateLeaseListing();
    }

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    await createLog(
      'success',
      `Listing verified: ${result.rows[0].title} (ID: ${listingId}, type: ${listingType ?? 'unknown'})`,
      'verifyListing'
    );

    return res.json({
      success: true,
      message: 'Listing verified.',
      listing: { ...result.rows[0], type: listingType || result.rows[0].type },
    });
  } catch (err) {
    await createLog('error', `verifyListing error: ${err.message}`, 'verifyListing');
    console.error('VerifyListing error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};


const createLog = async (level, message, source, userId = null) => {
  try {
    // silently skip if logs table doesn't exist yet
    const { rows } = await pool.query(`SELECT to_regclass('public.logs') AS t`);
    if (!rows[0].t) return;

    await pool.query(
      `INSERT INTO logs (level, message, source, user_id) VALUES ($1, $2, $3, $4)`,
      [level, message, source, userId]
    );
  } catch (err) {
    console.error('createLog error:', err.message);
  }
};

const getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Check if logs table exists first
    const tableCheck = await pool.query(`
      SELECT to_regclass('public.logs') AS logs_table
    `);

    if (!tableCheck.rows[0].logs_table) {
      return res.json({ success: true, logs: [] });
    }

    const result = await pool.query(
      `SELECT * FROM logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [parseInt(limit), parseInt(offset)]
    );

    res.json({ success: true, logs: result.rows });
  } catch (err) {
    console.error('GetLogs error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  loginAdmin, getStats,
  getOrders, getAllUsers,
  verifyUser, deleteUser, getLogs,
  getAllListings, verifyListing
};
