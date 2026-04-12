const pool = require('../config/db');

// Helper: format listing row to match frontend Listing type
const formatListing = (row) => ({
  id: String(row.id),
  title: row.title,
  description: row.description,
  price: parseFloat(row.price),
  priceUnit: row.price_unit || undefined,
  type: row.type,
  category: row.category,
  condition: row.condition,
  location: row.location,
  distance: row.distance || '0 km',
  imageUrl: row.image_url,
  isVerified: row.is_verified,
  isAvailable: row.is_available,
  seller: {
    id: row.seller_id,
    name: row.seller_name,
    rating: parseFloat(row.seller_rating) || 0,
    avatarUrl: row.seller_avatar,
    isVerified: row.seller_verified,
  },
  createdAt: row.created_at,
});

// @desc    Get all listings (with filters)
// @route   GET /api/listings
// @access  Public
// Query params: type, category, search, minPrice, maxPrice, condition, page, limit
const getListings = async (req, res) => {
  try {
    const {
      type,
      category,
      search,
      minPrice,
      maxPrice,
      condition,
      page = 1,
      limit = 20,
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = ['l.is_available = true'];
    const values = [];
    let idx = 1;

    if (type) { conditions.push(`l.type = $${idx++}`); values.push(type.toUpperCase()); }
    if (category && category !== 'All') { conditions.push(`l.category = $${idx++}`); values.push(category); }
    if (search) { conditions.push(`(l.title ILIKE $${idx++} OR l.description ILIKE $${idx - 1})`); values.push(`%${search}%`); }
    if (minPrice) { conditions.push(`l.price >= $${idx++}`); values.push(minPrice); }
    if (maxPrice) { conditions.push(`l.price <= $${idx++}`); values.push(maxPrice); }
    if (condition) { conditions.push(`l.condition = $${idx++}`); values.push(condition); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        l.*,
        u.name AS seller_name,
        u.rating AS seller_rating,
        u.avatar_url AS seller_avatar,
        u.is_verified AS seller_verified
      FROM listings l
      JOIN users u ON l.seller_id = u.id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    values.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, values);

    // Count total for pagination
    const countQuery = `SELECT COUNT(*) FROM listings l ${whereClause}`;
    const countResult = await pool.query(countQuery, values.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      listings: result.rows.map(formatListing),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('GetListings error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get single listing by ID
// @route   GET /api/listings/:id
// @access  Public
const getListingById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, u.name AS seller_name, u.rating AS seller_rating,
              u.avatar_url AS seller_avatar, u.is_verified AS seller_verified
       FROM listings l
       JOIN users u ON l.seller_id = u.id
       WHERE l.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    res.json({ success: true, listing: formatListing(result.rows[0]) });
  } catch (err) {
    console.error('GetListingById error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Create a new listing
// @route   POST /api/listings
// @access  Private
const createListing = async (req, res) => {
  try {
    const { title, description, price, price_unit, type, category, condition, location } = req.body;
    const image_url = req.file ? req.file.path : null;

    // Validation
    if (!title || !description || !price || !type || !category || !condition || !location) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (!['SALE', 'LEASE'].includes(type.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Type must be SALE or LEASE.' });
    }

    if (type.toUpperCase() === 'LEASE' && !price_unit) {
      return res.status(400).json({ success: false, message: 'Price unit (e.g. /day) is required for leases.' });
    }

    const result = await pool.query(
      `INSERT INTO listings (title, description, price, price_unit, type, category, condition, location, image_url, seller_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [title, description, price, price_unit || null, type.toUpperCase(), category, condition, location, image_url, req.user.id]
    );

    // Update active_listings count for seller
    await pool.query('UPDATE users SET active_listings = active_listings + 1 WHERE id = $1', [req.user.id]);

    const listing = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Listing created successfully.',
      listing: {
        ...formatListing({ ...listing, seller_name: req.user.name, seller_rating: 0, seller_avatar: req.user.avatar_url, seller_verified: req.user.is_verified }),
      },
    });
  } catch (err) {
    console.error('CreateListing error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Update a listing
// @route   PUT /api/listings/:id
// @access  Private (owner only)
const updateListing = async (req, res) => {
  try {
    const listing = await pool.query('SELECT * FROM listings WHERE id = $1', [req.params.id]);

    if (listing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    if (listing.rows[0].seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this listing.' });
    }

    const { title, description, price, price_unit, category, condition, location, is_available } = req.body;
    const image_url = req.file ? req.file.path : undefined;

    const fields = [];
    const values = [];
    let idx = 1;

    if (title) { fields.push(`title = $${idx++}`); values.push(title); }
    if (description) { fields.push(`description = $${idx++}`); values.push(description); }
    if (price) { fields.push(`price = $${idx++}`); values.push(price); }
    if (price_unit !== undefined) { fields.push(`price_unit = $${idx++}`); values.push(price_unit); }
    if (category) { fields.push(`category = $${idx++}`); values.push(category); }
    if (condition) { fields.push(`condition = $${idx++}`); values.push(condition); }
    if (location) { fields.push(`location = $${idx++}`); values.push(location); }
    if (is_available !== undefined) { fields.push(`is_available = $${idx++}`); values.push(is_available); }
    if (image_url) { fields.push(`image_url = $${idx++}`); values.push(image_url); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE listings SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    res.json({ success: true, message: 'Listing updated.', listing: result.rows[0] });
  } catch (err) {
    console.error('UpdateListing error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Delete a listing
// @route   DELETE /api/listings/:id
// @access  Private (owner or admin)
const deleteListing = async (req, res) => {
  try {
    const listing = await pool.query('SELECT * FROM listings WHERE id = $1', [req.params.id]);

    if (listing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    if (listing.rows[0].seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this listing.' });
    }

    await pool.query('DELETE FROM listings WHERE id = $1', [req.params.id]);
    await pool.query('UPDATE users SET active_listings = GREATEST(active_listings - 1, 0) WHERE id = $1', [req.user.id]);

    res.json({ success: true, message: 'Listing deleted successfully.' });
  } catch (err) {
    console.error('DeleteListing error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get listings by the logged-in user (My Listings)
// @route   GET /api/listings/my
// @access  Private
const getMyListings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, u.name AS seller_name, u.rating AS seller_rating,
              u.avatar_url AS seller_avatar, u.is_verified AS seller_verified
       FROM listings l
       JOIN users u ON l.seller_id = u.id
       WHERE l.seller_id = $1
       ORDER BY l.created_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, listings: result.rows.map(formatListing) });
  } catch (err) {
    console.error('GetMyListings error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get categories
// @route   GET /api/listings/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json({ success: true, categories: result.rows });
  } catch (err) {
    console.error('GetCategories error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
  getCategories,
};
