const pool = require('../config/db');

const LISTING_TYPES = {
  SALE: 'SALE',
  LEASE: 'LEASE',
};

const DEFAULT_CONDITIONS = [
  'Brand New',
  'Like New',
  'Excellent',
  'Good',
  'Used Like New',
  'Fair',
];

const resolveUploadedImageUrl = (file) => {
  if (!file) return undefined;
  return file.path || file.secure_url || file.url;
};

const parseListingType = (rawType) => {
  if (!rawType) return null;
  const normalized = String(rawType).toUpperCase().trim();
  if (normalized === LISTING_TYPES.SALE || normalized === LISTING_TYPES.LEASE) {
    return normalized;
  }
  return null;
};

const buildSaleSelect = (alias = 's') => `
  ${alias}.id,
  ${alias}.title,
  ${alias}.description,
  ${alias}.price,
  NULL::VARCHAR AS price_unit,
  NULL::INT AS min_duration,
  NULL::INT AS max_duration,
  NULL::VARCHAR AS duration_unit,
  NULL::DATE AS available_from,
  NULL::DATE AS available_until,
  '${LISTING_TYPES.SALE}'::VARCHAR AS type,
  ${alias}.category,
  ${alias}.condition,
  ${alias}.location,
  ${alias}.image_url,
  ${alias}.is_verified,
  ${alias}.is_available,
  ${alias}.is_sold,
  ${alias}.seller_id,
  u.name AS seller_name,
  u.rating AS seller_rating,
  u.avatar_url AS seller_avatar,
  u.is_verified AS seller_verified,
  ${alias}.created_at,
  ${alias}.updated_at
`;

const buildLeaseSelect = (alias = 'l') => `
  ${alias}.id,
  ${alias}.title,
  ${alias}.description,
  ${alias}.price,
  ${alias}.price_unit,
  ${alias}.min_duration,
  ${alias}.max_duration,
  ${alias}.duration_unit,
  ${alias}.available_from,
  ${alias}.available_until,
  '${LISTING_TYPES.LEASE}'::VARCHAR AS type,
  ${alias}.category,
  ${alias}.condition,
  ${alias}.location,
  ${alias}.image_url,
  ${alias}.is_verified,
  ${alias}.is_available,
  FALSE AS is_sold,
  ${alias}.seller_id,
  u.name AS seller_name,
  u.rating AS seller_rating,
  u.avatar_url AS seller_avatar,
  u.is_verified AS seller_verified,
  ${alias}.created_at,
  ${alias}.updated_at
`;

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== '';

const buildListingFilters = (query, alias, startIndex = 1) => {
  const conditions = [];
  const values = [];
  let idx = startIndex;

  if (hasValue(query.category) && query.category !== 'All') {
    conditions.push(`${alias}.category = $${idx++}`);
    values.push(String(query.category).trim());
  }

  if (hasValue(query.search)) {
    conditions.push(`(${alias}.title ILIKE $${idx} OR ${alias}.description ILIKE $${idx})`);
    values.push(`%${String(query.search).trim()}%`);
    idx += 1;
  }

  if (hasValue(query.minPrice)) {
    conditions.push(`${alias}.price >= $${idx++}`);
    values.push(Number(query.minPrice));
  }

  if (hasValue(query.maxPrice)) {
    conditions.push(`${alias}.price <= $${idx++}`);
    values.push(Number(query.maxPrice));
  }

  if (hasValue(query.condition)) {
    conditions.push(`${alias}.condition = $${idx++}`);
    values.push(String(query.condition).trim());
  }

  return {
    conditions,
    values,
    nextIndex: idx,
  };
};

const buildWhereClause = (baseConditions, dynamicConditions) => {
  const combined = [...baseConditions, ...dynamicConditions];
  return `WHERE ${combined.join(' AND ')}`;
};

const fetchListingByIdWithSeller = async (listingId, type) => {
  if (type === LISTING_TYPES.SALE) {
    return pool.query(
      `
        SELECT
          ${buildSaleSelect('s')}
        FROM sale_listings s
        JOIN users u ON s.seller_id = u.id
        WHERE s.id = $1
      `,
      [listingId]
    );
  }

  return pool.query(
    `
      SELECT
        ${buildLeaseSelect('l')}
      FROM lease_listings l
      JOIN users u ON l.seller_id = u.id
      WHERE l.id = $1
    `,
    [listingId]
  );
};

const resolveListingRecord = async (listingId, typeHint) => {
  const fetchSale = async () => {
    const result = await pool.query('SELECT * FROM sale_listings WHERE id = $1', [listingId]);
    return result.rows[0]
      ? { table: 'sale_listings', type: LISTING_TYPES.SALE, row: result.rows[0] }
      : null;
  };

  const fetchLease = async () => {
    const result = await pool.query('SELECT * FROM lease_listings WHERE id = $1', [listingId]);
    return result.rows[0]
      ? { table: 'lease_listings', type: LISTING_TYPES.LEASE, row: result.rows[0] }
      : null;
  };

  if (typeHint === LISTING_TYPES.SALE) {
    return fetchSale();
  }

  if (typeHint === LISTING_TYPES.LEASE) {
    return fetchLease();
  }

  const [sale, lease] = await Promise.all([fetchSale(), fetchLease()]);

  if (sale && lease) {
    return { ambiguous: true };
  }

  return sale || lease || null;
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
  userId: row.seller_id,
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

const getListings = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (pageNumber - 1) * pageSize;

    const requestedTypeRaw = req.query.type;
    const requestedType = parseListingType(requestedTypeRaw);

    if (requestedTypeRaw && !requestedType) {
      return res.status(400).json({ success: false, message: 'type must be SALE or LEASE.' });
    }

    if (requestedType === LISTING_TYPES.SALE || requestedType === LISTING_TYPES.LEASE) {
      const alias = requestedType === LISTING_TYPES.SALE ? 's' : 'l';
      const table = requestedType === LISTING_TYPES.SALE ? 'sale_listings' : 'lease_listings';
      const selectColumns = requestedType === LISTING_TYPES.SALE
        ? buildSaleSelect(alias)
        : buildLeaseSelect(alias);

      const baseConditions = requestedType === LISTING_TYPES.SALE
        ? [`${alias}.is_available = true`, `${alias}.is_sold = false`]
        : [`${alias}.is_available = true`];

      const { conditions, values, nextIndex } = buildListingFilters(req.query, alias);
      const whereClause = buildWhereClause(baseConditions, conditions);

      const listingsResult = await pool.query(
        `
          SELECT
            ${selectColumns}
          FROM ${table} ${alias}
          JOIN users u ON ${alias}.seller_id = u.id
          ${whereClause}
          ORDER BY ${alias}.created_at DESC
          LIMIT $${nextIndex} OFFSET $${nextIndex + 1}
        `,
        [...values, pageSize, offset]
      );

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM ${table} ${alias} ${whereClause}`,
        values
      );

      const total = parseInt(countResult.rows[0].count, 10);

      return res.json({
        success: true,
        listings: listingsResult.rows.map(formatListing),
        pagination: {
          total,
          page: pageNumber,
          limit: pageSize,
          pages: Math.ceil(total / pageSize),
        },
      });
    }

    const saleFilters = buildListingFilters(req.query, 's', 1);
    const saleWhereClause = buildWhereClause(
      ['s.is_available = true', 's.is_sold = false'],
      saleFilters.conditions
    );

    const leaseFilters = buildListingFilters(req.query, 'l', saleFilters.nextIndex);
    const leaseWhereClause = buildWhereClause(
      ['l.is_available = true'],
      leaseFilters.conditions
    );

    const limitIndex = leaseFilters.nextIndex;
    const offsetIndex = leaseFilters.nextIndex + 1;
    const mergedValues = [...saleFilters.values, ...leaseFilters.values];

    const result = await pool.query(
      `
        SELECT * FROM (
          SELECT
            ${buildSaleSelect('s')}
          FROM sale_listings s
          JOIN users u ON s.seller_id = u.id
          ${saleWhereClause}

          UNION ALL

          SELECT
            ${buildLeaseSelect('l')}
          FROM lease_listings l
          JOIN users u ON l.seller_id = u.id
          ${leaseWhereClause}
        ) combined
        ORDER BY combined.created_at DESC
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
      `,
      [...mergedValues, pageSize, offset]
    );

    const countResult = await pool.query(
      `
        SELECT (
          (SELECT COUNT(*) FROM sale_listings s ${saleWhereClause}) +
          (SELECT COUNT(*) FROM lease_listings l ${leaseWhereClause})
        ) AS total
      `,
      mergedValues
    );

    const total = parseInt(countResult.rows[0].total, 10);

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
    const listingId = Number(req.params.id);
    if (!Number.isInteger(listingId)) {
      return res.status(400).json({ success: false, message: 'Invalid listing id.' });
    }

    const requestedTypeRaw = req.query.type;
    const requestedType = parseListingType(requestedTypeRaw);

    if (requestedTypeRaw && !requestedType) {
      return res.status(400).json({ success: false, message: 'type must be SALE or LEASE.' });
    }

    const resolved = await resolveListingRecord(listingId, requestedType);

    if (resolved?.ambiguous) {
      return res.status(400).json({
        success: false,
        message: 'Listing id exists in both SALE and LEASE tables. Include query param type=SALE or type=LEASE.',
      });
    }

    if (!resolved) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    const result = await fetchListingByIdWithSeller(listingId, resolved.type);

    res.json({ success: true, listing: formatListing(result.rows[0]) });
  } catch (err) {
    console.error('GetListingById error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const normalizeLeaseFields = (body, typeUpper) => {
  if (typeUpper !== LISTING_TYPES.LEASE) {
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

    if (typeUpper !== LISTING_TYPES.SALE && typeUpper !== LISTING_TYPES.LEASE) {
      return res.status(400).json({ success: false, message: 'type must be SALE or LEASE.' });
    }

    const leaseFields = normalizeLeaseFields(req.body, typeUpper);

    let result;

    if (typeUpper === LISTING_TYPES.SALE) {
      result = await pool.query(
        `
          INSERT INTO sale_listings (
            title, description, price, category,
            condition, location, image_url, seller_id
          )
          VALUES (
            $1, $2, $3, $4,
            $5, $6, $7, $8
          )
          RETURNING *
        `,
        [
          title,
          description,
          price,
          category,
          condition,
          location,
          image_url,
          req.user.id,
        ]
      );
    } else {
      result = await pool.query(
        `
          INSERT INTO lease_listings (
            title, description, price, price_unit, min_duration, max_duration,
            duration_unit, available_from, available_until, category,
            condition, location, image_url, seller_id
          )
          VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, COALESCE($8, CURRENT_DATE), $9, $10,
            $11, $12, $13, $14
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
          category,
          condition,
          location,
          image_url,
          req.user.id,
        ]
      );
    }

    await pool.query(
      'UPDATE users SET active_listings = active_listings + 1 WHERE id = $1',
      [req.user.id]
    );

    const listing = result.rows[0];

    const listingForResponse = typeUpper === LISTING_TYPES.SALE
      ? {
        ...listing,
        type: LISTING_TYPES.SALE,
        price_unit: null,
        min_duration: null,
        max_duration: null,
        duration_unit: null,
        available_from: null,
        available_until: null,
      }
      : {
        ...listing,
        type: LISTING_TYPES.LEASE,
        is_sold: false,
      };

    res.status(201).json({
      success: true,
      message: 'Listing created successfully.',
      listing: formatListing({
        ...listingForResponse,
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
    const listingId = Number(req.params.id);
    if (!Number.isInteger(listingId)) {
      return res.status(400).json({ success: false, message: 'Invalid listing id.' });
    }

    const typeHintRaw = req.query.type || req.body.type;
    const typeHint = parseListingType(typeHintRaw);

    if (typeHintRaw && !typeHint) {
      return res.status(400).json({ success: false, message: 'type must be SALE or LEASE.' });
    }

    const resolved = await resolveListingRecord(listingId, typeHint);

    if (resolved?.ambiguous) {
      return res.status(400).json({
        success: false,
        message: 'Listing id exists in both SALE and LEASE tables. Include query param type=SALE or type=LEASE.',
      });
    }

    if (!resolved) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    const existing = resolved.row;

    if (existing.seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this listing.' });
    }

    if (req.body.type && parseListingType(req.body.type) && parseListingType(req.body.type) !== resolved.type) {
      return res.status(400).json({
        success: false,
        message: 'Changing listing type between SALE and LEASE is not supported. Create a new listing instead.',
      });
    }

    const image_url = resolveUploadedImageUrl(req.file);
    const isSale = resolved.type === LISTING_TYPES.SALE;
    const table = isSale ? 'sale_listings' : 'lease_listings';

    const fieldMap = isSale
      ? {
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        condition: req.body.condition,
        location: req.body.location,
        is_available: req.body.is_available,
        image_url,
      }
      : {
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        price_unit: req.body.price_unit,
        min_duration: req.body.min_duration,
        max_duration: req.body.max_duration,
        duration_unit: req.body.duration_unit,
        available_from: req.body.available_from,
        available_until: req.body.available_until,
        category: req.body.category,
        condition: req.body.condition,
        location: req.body.location,
        is_available: req.body.is_available,
        image_url,
      };

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

    values.push(listingId);
    await pool.query(`UPDATE ${table} SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);

    const fullListingResult = await fetchListingByIdWithSeller(listingId, resolved.type);

    res.json({
      success: true,
      message: 'Listing updated.',
      listing: formatListing(fullListingResult.rows[0]),
    });
  } catch (err) {
    console.error('UpdateListing error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteListing = async (req, res) => {
  try {
    const listingId = Number(req.params.id);
    if (!Number.isInteger(listingId)) {
      return res.status(400).json({ success: false, message: 'Invalid listing id.' });
    }

    const typeHintRaw = req.query.type;
    const typeHint = parseListingType(typeHintRaw);

    if (typeHintRaw && !typeHint) {
      return res.status(400).json({ success: false, message: 'type must be SALE or LEASE.' });
    }

    const listing = await resolveListingRecord(listingId, typeHint);

    if (listing?.ambiguous) {
      return res.status(400).json({
        success: false,
        message: 'Listing id exists in both SALE and LEASE tables. Include query param type=SALE or type=LEASE.',
      });
    }

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    if (listing.row.seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this listing.' });
    }

    await pool.query(`DELETE FROM ${listing.table} WHERE id = $1`, [listingId]);
    await pool.query(
      'UPDATE users SET active_listings = GREATEST(active_listings - 1, 0) WHERE id = $1',
      [listing.row.seller_id]
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
        SELECT * FROM (
          SELECT
            ${buildSaleSelect('s')}
          FROM sale_listings s
          JOIN users u ON s.seller_id = u.id
          WHERE s.seller_id = $1

          UNION ALL

          SELECT
            ${buildLeaseSelect('l')}
          FROM lease_listings l
          JOIN users u ON l.seller_id = u.id
          WHERE l.seller_id = $1
        ) combined
        ORDER BY combined.created_at DESC
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
    const categoryTableResult = await pool.query(
      'SELECT name FROM categories ORDER BY name'
    );

    let categories = categoryTableResult.rows.map((row) => row.name);

    if (!categories.length) {
      const fallbackResult = await pool.query(
        `
          SELECT DISTINCT category FROM (
            SELECT category FROM sale_listings WHERE category IS NOT NULL
            UNION
            SELECT category FROM lease_listings WHERE category IS NOT NULL
          ) categories
          ORDER BY category
        `
      );
      categories = fallbackResult.rows.map((row) => row.category);
    }

    res.json({ success: true, categories });
  } catch (err) {
    console.error('GetCategories error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getConditions = async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT DISTINCT condition FROM (
          SELECT condition FROM sale_listings WHERE condition IS NOT NULL
          UNION
          SELECT condition FROM lease_listings WHERE condition IS NOT NULL
        ) conditions
        ORDER BY condition
      `
    );

    const conditions = result.rows.length
      ? result.rows.map((row) => row.condition)
      : DEFAULT_CONDITIONS;

    res.json({ success: true, conditions });
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
