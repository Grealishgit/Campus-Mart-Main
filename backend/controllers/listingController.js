const pool = require('../config/db');

const resolveUploadedImageUrl = (file) => {
  if (!file) return undefined;
  return file.path || file.secure_url || file.url;
};

const formatListing = (row) => ({
  id: String(row.id),
  title: row.title,
  description: row.description,
  price: parseFloat(row.price),
  priceUnit: row.price_unit || undefined,
  minDuration: row.min_duration ?? undefined,
  maxDuration: row.max_duration ?? undefined,
  durationUnit: row.duration_unit || undefined,
  availableFrom: row.available_from || undefined,
  availableUntil: row.available_until || undefined,
  type: row.type,
  category: row.category,
  condition: row.condition,
  location: row.location,
  distance: row.distance || '0 km',
  imageUrl: row.image_url,
  isVerified: row.is_verified,
  isAvailable: row.is_available,
  isSold: row.is_sold,
  seller: {
    id: row.seller_id,
    name: row.seller_name,
    rating: parseFloat(row.seller_rating) || 0,
    avatarUrl: row.seller_avatar,
    isVerified: row.seller_verified,
  },
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const buildListingWhereClause = (query) => {
  const {
    type,
    category,
    search,
    minPrice,
    maxPrice,
    condition,
  } = query;

  const conditions = ['l.is_available = true'];
  const values = [];
  let idx = 1;

  if (type) {
    conditions.push(`l.type = $${idx++}`);
    values.push(String(type).toUpperCase().trim());
  }
  if (category && category !== 'All') {
    conditions.push(`l.category = $${idx++}`);
    values.push(category);
  }
  if (search) {
    conditions.push(`(l.title ILIKE $${idx} OR l.description ILIKE $${idx})`);
    values.push(`%${search}%`);
    idx += 1;
  }
  if (minPrice) {
    conditions.push(`l.price >= $${idx++}`);
    values.push(minPrice);
  }
  if (maxPrice) {
    conditions.push(`l.price <= $${idx++}`);
    values.push(maxPrice);
  }
  if (condition) {
    conditions.push(`l.condition = $${idx++}`);
    values.push(condition);
  }

  return {
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
    nextIndex: idx,
  };
};

const getListings = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNumber = Number(page);
    const pageSize = Number(limit);
    const offset = (pageNumber - 1) * pageSize;

    const { whereClause, values, nextIndex } = buildListingWhereClause(req.query);

    const result = await pool.query(
      `
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
        LIMIT $${nextIndex} OFFSET $${nextIndex + 1}
      `,
      [...values, pageSize, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM listings l ${whereClause}`,
      values
    );

    const total = parseInt(countResult.rows[0].count, 10);

    res.json({
      success: true,
      listings: result.rows.map(formatListing),
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error('GetListings error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getListingById = async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          l.*,
          u.name AS seller_name,
          u.rating AS seller_rating,
          u.avatar_url AS seller_avatar,
          u.is_verified AS seller_verified
        FROM listings l
        JOIN users u ON l.seller_id = u.id
        WHERE l.id = $1
      `,
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

const normalizeLeaseFields = (body, typeUpper) => {
  if (typeUpper !== 'LEASE') {
    return {
      price_unit: null,
      min_duration: null,
      max_duration: null,
      duration_unit: null,
      available_from: null,
      available_until: null,
    };
  }

  return {
    price_unit: body.price_unit || null,
    min_duration: body.min_duration || null,
    max_duration: body.max_duration || null,
    duration_unit: body.duration_unit || null,
    available_from: body.available_from || null,
    available_until: body.available_until || null,
  };
};

const createListing = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      type,
      category,
      condition,
      location,
    } = req.body;
    const image_url = resolveUploadedImageUrl(req.file) || null;

    const typeUpper = String(type).toUpperCase().trim();
    const leaseFields = normalizeLeaseFields(req.body, typeUpper);

    const result = await pool.query(
      `
        INSERT INTO listings (
          title, description, price, price_unit, min_duration, max_duration,
          duration_unit, available_from, available_until, type, category,
          condition, location, image_url, seller_id
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, COALESCE($8, CURRENT_DATE), $9, $10, $11,
          $12, $13, $14, $15
        )
        RETURNING *
      `,
      [
        title,
        description,
        price,
        leaseFields.price_unit,
        leaseFields.min_duration,
        leaseFields.max_duration,
        leaseFields.duration_unit,
        leaseFields.available_from,
        leaseFields.available_until,
        typeUpper,
        category,
        condition,
        location,
        image_url,
        req.user.id,
      ]
    );

    await pool.query(
      'UPDATE users SET active_listings = active_listings + 1 WHERE id = $1',
      [req.user.id]
    );

    const listing = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Listing created successfully.',
      listing: formatListing({
        ...listing,
        seller_name: req.user.name,
        seller_rating: req.user.rating || 0,
        seller_avatar: req.user.avatar_url,
        seller_verified: req.user.is_verified,
      }),
    });
  } catch (err) {
    console.error('CreateListing error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateListing = async (req, res) => {
  try {
    const existingResult = await pool.query('SELECT * FROM listings WHERE id = $1', [req.params.id]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    const existing = existingResult.rows[0];

    if (existing.seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this listing.' });
    }

    const image_url = resolveUploadedImageUrl(req.file);
    const nextType = req.body.type ? String(req.body.type).toUpperCase().trim() : existing.type;

    const fieldMap = {
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      price_unit: req.body.price_unit,
      min_duration: req.body.min_duration,
      max_duration: req.body.max_duration,
      duration_unit: req.body.duration_unit,
      available_from: req.body.available_from,
      available_until: req.body.available_until,
      type: nextType,
      category: req.body.category,
      condition: req.body.condition,
      location: req.body.location,
      is_available: req.body.is_available,
      image_url,
    };

    if (nextType !== 'LEASE') {
      fieldMap.price_unit = null;
      fieldMap.min_duration = null;
      fieldMap.max_duration = null;
      fieldMap.duration_unit = null;
      fieldMap.available_from = existing.available_from;
      fieldMap.available_until = null;
    }

    const fields = [];
    const values = [];
    let idx = 1;

    Object.entries(fieldMap).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(value);
      }
    });

    if (!fields.length) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE listings SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    res.json({ success: true, message: 'Listing updated.', listing: formatListing(result.rows[0]) });
  } catch (err) {
    console.error('UpdateListing error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

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
    await pool.query(
      'UPDATE users SET active_listings = GREATEST(active_listings - 1, 0) WHERE id = $1',
      [listing.rows[0].seller_id]
    );

    res.json({ success: true, message: 'Listing deleted successfully.' });
  } catch (err) {
    console.error('DeleteListing error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getMyListings = async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          l.*,
          u.name AS seller_name,
          u.rating AS seller_rating,
          u.avatar_url AS seller_avatar,
          u.is_verified AS seller_verified
        FROM listings l
        JOIN users u ON l.seller_id = u.id
        WHERE l.seller_id = $1
        ORDER BY l.created_at DESC
      `,
      [req.user.id]
    );

    res.json({ success: true, listings: result.rows.map(formatListing) });
  } catch (err) {
    console.error('GetMyListings error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM listings WHERE category IS NOT NULL ORDER BY category'
    );
    res.json({ success: true, categories: result.rows });
  } catch (err) {
    console.error('GetCategories error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getConditions = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT condition FROM listings WHERE condition IS NOT NULL ORDER BY condition'
    );
    res.json({ success: true, conditions: result.rows });
  } catch (err) {
    console.error('GetConditions error:', err.message);
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
  getConditions,
};
