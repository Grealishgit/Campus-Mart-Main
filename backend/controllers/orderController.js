const pool = require('../config/db');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const PRICE_UNIT_TO_DURATION_UNIT = {
  '/hour': 'hours',
  '/day': 'days',
  '/week': 'weeks',
  '/month': 'months',
};

/** Terminal statuses — no further transitions allowed once reached. */
const TERMINAL_STATUSES = new Set(['completed', 'cancelled']);

/** All valid status values the API accepts. */
const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Calculate the number of billing units between two ISO date strings
 * based on the listing's price_unit.
 */
const calculateLeaseUnits = (leaseStart, leaseEnd, priceUnit) => {
  const start = new Date(`${leaseStart}T00:00:00Z`);
  const end   = new Date(`${leaseEnd}T00:00:00Z`);
  const diffInDays = Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY);

  switch (priceUnit) {
    case '/hour':  return diffInDays * 24;
    case '/day':   return diffInDays;
    case '/week':  return Math.ceil(diffInDays / 7);
    case '/month': return Math.ceil(diffInDays / 30);
    default:       return diffInDays;
  }
};

/**
 * Normalise a raw DB row into the public order shape.
 * Works for rows from INSERT RETURNING as well as the enriched SELECT queries.
 */
const formatOrder = (row) => ({
  id:        String(row.id),
  // Expose whichever listing FK is populated
  listingId: row.sale_listing_id
               ? String(row.sale_listing_id)
               : String(row.lease_listing_id),
  buyerId:   row.buyer_id,
  sellerId:  row.seller_id,
  status:    row.status,
  type:      row.type,
  totalPrice: parseFloat(row.amount),
  // Explicit null-check: a listing_price of 0 must not fall back to amount
  rate: row.listing_price != null
          ? parseFloat(row.listing_price)
          : parseFloat(row.amount),
  priceUnit:     row.price_unit     ?? undefined,
  leaseStart:    row.lease_start    ?? undefined,
  leaseEnd:      row.lease_end      ?? undefined,
  durationValue: row.duration_value != null ? Number(row.duration_value) : undefined,
  durationUnit:  row.duration_unit  ?? undefined,
  createdAt:     row.created_at,
  updatedAt:     row.updated_at,
  listing: {
    title:    row.title,
    imageUrl: row.image_url,
    category: row.category,
    location: row.location,
  },
  buyer: row.buyer_name
    ? { name: row.buyer_name,  avatarUrl: row.buyer_avatar  }
    : undefined,
  seller: row.seller_name
    ? { name: row.seller_name, avatarUrl: row.seller_avatar }
    : undefined,
});

// ---------------------------------------------------------------------------
// Shared SQL builders
// ---------------------------------------------------------------------------
// The schema has two listing tables (sale_listings, lease_listings).
// Orders carries sale_listing_id and lease_listing_id as separate nullable FKs.
// We LEFT JOIN both tables and COALESCE the columns we need so a single
// query handles both order types correctly.
// ---------------------------------------------------------------------------

const buildOrdersQuery = (perspective) => {
  const isbuyer       = perspective === 'buyer';
  const filterCol     = isbuyer ? 'o.buyer_id'  : 'o.seller_id';
  const counterpartId = isbuyer ? 'o.seller_id' : 'o.buyer_id';
  const counterpart   = isbuyer ? 'seller'       : 'buyer';

  return `
    SELECT
      o.*,
      COALESCE(sl.title,     ll.title)     AS title,
      COALESCE(sl.image_url, ll.image_url) AS image_url,
      COALESCE(sl.category,  ll.category)  AS category,
      COALESCE(sl.location,  ll.location)  AS location,
      COALESCE(sl.price,     ll.price)     AS listing_price,
      ll.price_unit,

      CASE
        WHEN o.type = 'LEASE' AND ll.price_unit = '/hour'
          THEN CEIL((o.lease_end - o.lease_start) * 24.0)
        WHEN o.type = 'LEASE' AND ll.price_unit = '/day'
          THEN (o.lease_end - o.lease_start)
        WHEN o.type = 'LEASE' AND ll.price_unit = '/week'
          THEN CEIL((o.lease_end - o.lease_start) / 7.0)
        WHEN o.type = 'LEASE' AND ll.price_unit = '/month'
          THEN CEIL((o.lease_end - o.lease_start) / 30.0)
        ELSE NULL
      END AS duration_value,

      CASE
        WHEN ll.price_unit = '/hour'  THEN 'hours'
        WHEN ll.price_unit = '/day'   THEN 'days'
        WHEN ll.price_unit = '/week'  THEN 'weeks'
        WHEN ll.price_unit = '/month' THEN 'months'
        ELSE NULL
      END AS duration_unit,

      u.name       AS ${counterpart}_name,
      u.avatar_url AS ${counterpart}_avatar

    FROM  orders o
    LEFT  JOIN sale_listings  sl ON o.sale_listing_id  = sl.id
    LEFT  JOIN lease_listings ll ON o.lease_listing_id = ll.id
    JOIN  users u ON ${counterpartId} = u.id
    WHERE ${filterCol} = $1
    ORDER BY o.created_at DESC
  `;
};

// Single-order enriched fetch — used after updateOrderStatus.
const SINGLE_ORDER_QUERY = `
  SELECT
    o.*,
    COALESCE(sl.title,     ll.title)     AS title,
    COALESCE(sl.image_url, ll.image_url) AS image_url,
    COALESCE(sl.category,  ll.category)  AS category,
    COALESCE(sl.location,  ll.location)  AS location,
    COALESCE(sl.price,     ll.price)     AS listing_price,
    ll.price_unit,

    CASE
      WHEN o.type = 'LEASE' AND ll.price_unit = '/hour'
        THEN CEIL((o.lease_end - o.lease_start) * 24.0)
      WHEN o.type = 'LEASE' AND ll.price_unit = '/day'
        THEN (o.lease_end - o.lease_start)
      WHEN o.type = 'LEASE' AND ll.price_unit = '/week'
        THEN CEIL((o.lease_end - o.lease_start) / 7.0)
      WHEN o.type = 'LEASE' AND ll.price_unit = '/month'
        THEN CEIL((o.lease_end - o.lease_start) / 30.0)
      ELSE NULL
    END AS duration_value,

    CASE
      WHEN ll.price_unit = '/hour'  THEN 'hours'
      WHEN ll.price_unit = '/day'   THEN 'days'
      WHEN ll.price_unit = '/week'  THEN 'weeks'
      WHEN ll.price_unit = '/month' THEN 'months'
      ELSE NULL
    END AS duration_unit,

    buyer.name        AS buyer_name,
    buyer.avatar_url  AS buyer_avatar,
    seller.name       AS seller_name,
    seller.avatar_url AS seller_avatar

  FROM  orders o
  LEFT  JOIN sale_listings  sl  ON o.sale_listing_id  = sl.id
  LEFT  JOIN lease_listings ll  ON o.lease_listing_id = ll.id
  JOIN  users buyer  ON o.buyer_id  = buyer.id
  JOIN  users seller ON o.seller_id = seller.id
  WHERE o.id = $1
`;

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

/**
 * POST /api/orders
 *
 * Body (SALE):  { type: 'SALE',  listing_id: <sale_listing id> }
 * Body (LEASE): { type: 'LEASE', listing_id: <lease_listing id>,
 *                 lease_start: 'YYYY-MM-DD', lease_end: 'YYYY-MM-DD' }
 */
const createOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const { type, lease_start, lease_end } = req.body;
    const listingId = Number(req.body.listing_id ?? req.body.listingId);

    // --- Basic input guards ---
    if (!listingId) {
      return res.status(400).json({ success: false, message: 'listing_id is required.' });
    }

    if (!type || !['SALE', 'LEASE'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be SALE or LEASE.' });
    }

    await client.query('BEGIN');

    // --- Fetch and lock the correct listing table ---
    let listing;

    if (type === 'SALE') {
      const { rows } = await client.query(
        `SELECT * FROM sale_listings
         WHERE id = $1 AND is_available = true AND is_sold = false
         FOR UPDATE`,
        [listingId],
      );
      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Listing not found or no longer available.' });
      }
      listing = rows[0];
    } else {
      const { rows } = await client.query(
        `SELECT * FROM lease_listings
         WHERE id = $1 AND is_available = true
         FOR UPDATE`,
        [listingId],
      );
      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Listing not found or no longer available.' });
      }
      listing = rows[0];
    }

    // --- Cannot order your own listing ---
    if (listing.seller_id === req.user.id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'You cannot place an order on your own listing.' });
    }

    let amount        = parseFloat(listing.price);
    let durationValue = null;
    let durationUnit  = null;

    // --- LEASE-specific validation ---
    if (type === 'LEASE') {
      if (!lease_start || !lease_end) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'lease_start and lease_end are required for rentals.' });
      }

      const leaseStartDate = new Date(`${lease_start}T00:00:00Z`);
      const leaseEndDate   = new Date(`${lease_end}T00:00:00Z`);

      if (Number.isNaN(leaseStartDate.getTime()) || Number.isNaN(leaseEndDate.getTime())) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Lease dates must be valid calendar dates.' });
      }

      if (leaseEndDate <= leaseStartDate) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Lease end date must be after the start date.' });
      }

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      if (leaseStartDate < today) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Lease start date cannot be in the past.' });
      }

      if (listing.available_from && leaseStartDate < new Date(`${listing.available_from}T00:00:00Z`)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Lease start date is before the listing becomes available.' });
      }

      if (listing.available_until && leaseEndDate > new Date(`${listing.available_until}T00:00:00Z`)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Lease end date is after the listing availability window.' });
      }

      durationValue = calculateLeaseUnits(lease_start, lease_end, listing.price_unit);
      durationUnit  = PRICE_UNIT_TO_DURATION_UNIT[listing.price_unit] || 'days';

      if (listing.min_duration && durationValue < listing.min_duration) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Minimum lease duration is ${listing.min_duration} ${durationUnit}.`,
        });
      }

      if (listing.max_duration && durationValue > listing.max_duration) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Maximum lease duration is ${listing.max_duration} ${durationUnit}.`,
        });
      }

      amount = parseFloat(listing.price) * durationValue;

      // Note: the schema EXCLUDE constraint (btree_gist) enforces no-overlap
      // at the DB level. A violation throws Postgres error code 23P01, which
      // the catch block below surfaces as a clean 409.
    }

    // --- Insert the order ---
    // Exactly one of sale_listing_id / lease_listing_id is set, matching type.
    const { rows: orderRows } = await client.query(
      `
        INSERT INTO orders
          (buyer_id, seller_id, sale_listing_id, lease_listing_id,
           type, amount, lease_start, lease_end)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `,
      [
        req.user.id,
        listing.seller_id,
        type === 'SALE'  ? listingId : null,
        type === 'LEASE' ? listingId : null,
        type,
        amount,
        lease_start ?? null,
        lease_end   ?? null,
      ],
    );

    // --- SALE post-insert side-effects ---
    if (type === 'SALE') {
      await client.query(
        `UPDATE sale_listings
         SET is_available = false, is_sold = true, sold_at = NOW()
         WHERE id = $1`,
        [listingId],
      );
      await client.query(
        `UPDATE users
         SET total_sales     = total_sales + 1,
             active_listings = GREATEST(active_listings - 1, 0)
         WHERE id = $1`,
        [listing.seller_id],
      );
    }

    await client.query('COMMIT');

    // Build the response without a second DB round-trip.
    const order = formatOrder({
      ...orderRows[0],
      title:          listing.title,
      image_url:      listing.image_url,
      category:       listing.category,
      location:       listing.location,
      listing_price:  listing.price,
      price_unit:     listing.price_unit ?? null,
      duration_value: durationValue,
      duration_unit:  durationUnit,
    });

    return res.status(201).json({
      success: true,
      message: type === 'LEASE' ? 'Lease created successfully.' : 'Order placed successfully.',
      order,
    });
  } catch (err) {
    await client.query('ROLLBACK');

    // Postgres exclusion-violation = overlapping lease dates
    if (err.code === '23P01') {
      return res.status(409).json({
        success: false,
        message: 'Those lease dates are no longer available for this listing.',
      });
    }

    console.error('createOrder error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
};

/**
 * GET /api/orders/buying
 * All orders where the current user is the buyer.
 */
const getMyOrders = async (req, res) => {
  try {
    const { rows } = await pool.query(buildOrdersQuery('buyer'), [req.user.id]);
    return res.json({ success: true, orders: rows.map(formatOrder) });
  } catch (err) {
    console.error('getMyOrders error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * GET /api/orders/selling
 * All orders where the current user is the seller.
 */
const getSellingOrders = async (req, res) => {
  try {
    const { rows } = await pool.query(buildOrdersQuery('seller'), [req.user.id]);
    return res.json({ success: true, orders: rows.map(formatOrder) });
  } catch (err) {
    console.error('getSellingOrders error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * PATCH /api/orders/:id/status
 *
 * Permissions:
 *   Seller / admin → any valid non-terminal transition
 *   Buyer          → cancel only, while not yet completed/cancelled
 *
 * Cancellation side-effects:
 *   SALE  → restores sale_listing availability + rolls back seller stats
 *   LEASE → restores lease_listing availability
 */
const updateOrderStatus = async (req, res) => {
  const client = await pool.connect();

  try {
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}.`,
      });
    }

    await client.query('BEGIN');

    const { rows: orderRows } = await client.query(
      'SELECT * FROM orders WHERE id = $1 FOR UPDATE',
      [req.params.id],
    );

    if (orderRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order   = orderRows[0];
    const userId  = req.user.id;
    const isAdmin  = req.user.role === 'admin';
    const isSeller = order.seller_id === userId;
    const isBuyer  = order.buyer_id  === userId;

    if (!isAdmin && !isSeller && !isBuyer) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (isBuyer && !isAdmin && !isSeller && status !== 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: 'Buyers may only cancel their orders.' });
    }

    if (TERMINAL_STATUSES.has(order.status)) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: `Order is already ${order.status} and cannot be updated.`,
      });
    }

    await client.query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      [status, req.params.id],
    );

    // --- Cancellation side-effects ---
    if (status === 'cancelled') {
      if (order.type === 'SALE' && order.sale_listing_id) {
        await client.query(
          `UPDATE sale_listings
           SET is_available = true, is_sold = false, sold_at = NULL
           WHERE id = $1`,
          [order.sale_listing_id],
        );
        await client.query(
          `UPDATE users
           SET total_sales     = GREATEST(total_sales - 1, 0),
               active_listings = active_listings + 1
           WHERE id = $1`,
          [order.seller_id],
        );
      }

      if (order.type === 'LEASE' && order.lease_listing_id) {
        await client.query(
          'UPDATE lease_listings SET is_available = true WHERE id = $1',
          [order.lease_listing_id],
        );
      }
    }

    await client.query('COMMIT');

    const { rows: enrichedRows } = await pool.query(SINGLE_ORDER_QUERY, [req.params.id]);

    return res.json({
      success: true,
      message: 'Order status updated.',
      order:   formatOrder(enrichedRows[0]),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('updateOrderStatus error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
};

// ---------------------------------------------------------------------------

module.exports = { createOrder, getMyOrders, getSellingOrders, updateOrderStatus };