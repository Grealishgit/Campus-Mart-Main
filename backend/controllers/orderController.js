const pool = require('../config/db');

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const PRICE_UNIT_TO_DURATION_UNIT = {
  '/hour': 'hours',
  '/day': 'days',
  '/week': 'weeks',
  '/month': 'months',
};

const calculateLeaseUnits = (leaseStart, leaseEnd, priceUnit) => {
  const start = new Date(`${leaseStart}T00:00:00Z`);
  const end = new Date(`${leaseEnd}T00:00:00Z`);
  const diffInDays = Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY);

  switch (priceUnit) {
    case '/hour':
      return diffInDays * 24;
    case '/day':
      return diffInDays;
    case '/week':
      return Math.ceil(diffInDays / 7);
    case '/month':
      return Math.ceil(diffInDays / 30);
    default:
      return diffInDays;
  }
};

const formatOrder = (row) => ({
  id: String(row.id),
  listingId: String(row.listing_id),
  buyerId: row.buyer_id,
  sellerId: row.seller_id,
  status: row.status,
  type: row.type,
  totalPrice: parseFloat(row.amount),
  rate: parseFloat(row.listing_price || row.amount),
  priceUnit: row.price_unit || undefined,
  leaseStart: row.lease_start || undefined,
  leaseEnd: row.lease_end || undefined,
  durationValue: row.duration_value ? Number(row.duration_value) : undefined,
  durationUnit: row.duration_unit || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  listing: {
    title: row.title,
    imageUrl: row.image_url,
    category: row.category,
    location: row.location,
  },
  buyer: row.buyer_name ? {
    name: row.buyer_name,
    avatarUrl: row.buyer_avatar,
  } : undefined,
  seller: row.seller_name ? {
    name: row.seller_name,
    avatarUrl: row.seller_avatar,
  } : undefined,
});

const createOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const listingId = Number(req.body.listing_id ?? req.body.listingId);
    const { lease_start, lease_end } = req.body;

    if (!listingId) {
      return res.status(400).json({ success: false, message: 'listing_id is required.' });
    }

    await client.query('BEGIN');

    const listingResult = await client.query(
      'SELECT * FROM listings WHERE id = $1 AND is_available = true FOR UPDATE',
      [listingId]
    );

    if (listingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Listing not found or no longer available.' });
    }

    const listing = listingResult.rows[0];

    if (listing.seller_id === req.user.id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'You cannot place an order on your own listing.' });
    }

    let amount = parseFloat(listing.price);
    let durationValue = null;
    let durationUnit = null;

    if (listing.type === 'LEASE') {
      if (!lease_start || !lease_end) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Lease start and end dates are required for rentals.' });
      }

      const leaseStartDate = new Date(`${lease_start}T00:00:00Z`);
      const leaseEndDate = new Date(`${lease_end}T00:00:00Z`);
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      if (Number.isNaN(leaseStartDate.getTime()) || Number.isNaN(leaseEndDate.getTime())) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Lease dates must be valid calendar dates.' });
      }

      if (leaseEndDate <= leaseStartDate) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Lease end date must be after the start date.' });
      }

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
      durationUnit = PRICE_UNIT_TO_DURATION_UNIT[listing.price_unit] || 'days';

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

      const overlapResult = await client.query(
        `
          SELECT id FROM orders
          WHERE listing_id = $1
            AND type = 'LEASE'
            AND status IN ('pending', 'confirmed')
            AND daterange(lease_start, lease_end, '[]') && daterange($2::date, $3::date, '[]')
          LIMIT 1
        `,
        [listingId, lease_start, lease_end]
      );

      if (overlapResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          message: 'Those lease dates are no longer available for this item.',
        });
      }

      amount = parseFloat(listing.price) * durationValue;
    }

    const result = await client.query(
      `
        INSERT INTO orders (buyer_id, listing_id, seller_id, amount, type, lease_start, lease_end)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
      [req.user.id, listingId, listing.seller_id, amount, listing.type, lease_start || null, lease_end || null]
    );

    if (listing.type === 'SALE') {
      await client.query(
        'UPDATE listings SET is_available = false, is_sold = true, sold_at = NOW() WHERE id = $1',
        [listingId]
      );
      await client.query(
        'UPDATE users SET total_sales = total_sales + 1, active_listings = GREATEST(active_listings - 1, 0) WHERE id = $1',
        [listing.seller_id]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: listing.type === 'LEASE' ? 'Lease created successfully.' : 'Order placed successfully.',
      order: {
        ...formatOrder({
          ...result.rows[0],
          title: listing.title,
          image_url: listing.image_url,
          category: listing.category,
          location: listing.location,
          price_unit: listing.price_unit,
          listing_price: listing.price,
          duration_value: durationValue,
          duration_unit: durationUnit,
        }),
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('CreateOrder error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
};

const getMyOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          o.*,
          l.title,
          l.image_url,
          l.category,
          l.location,
          l.price AS listing_price,
          l.price_unit,
          CASE
            WHEN o.type = 'LEASE' AND l.price_unit = '/hour' THEN CEIL(EXTRACT(EPOCH FROM (o.lease_end::timestamp - o.lease_start::timestamp)) / 3600.0)
            WHEN o.type = 'LEASE' AND l.price_unit = '/day' THEN CEIL(EXTRACT(EPOCH FROM (o.lease_end::timestamp - o.lease_start::timestamp)) / 86400.0)
            WHEN o.type = 'LEASE' AND l.price_unit = '/week' THEN CEIL(EXTRACT(EPOCH FROM (o.lease_end::timestamp - o.lease_start::timestamp)) / 604800.0)
            WHEN o.type = 'LEASE' AND l.price_unit = '/month' THEN CEIL(EXTRACT(EPOCH FROM (o.lease_end::timestamp - o.lease_start::timestamp)) / 2592000.0)
            ELSE NULL
          END AS duration_value,
          CASE
            WHEN l.price_unit = '/hour' THEN 'hours'
            WHEN l.price_unit = '/day' THEN 'days'
            WHEN l.price_unit = '/week' THEN 'weeks'
            WHEN l.price_unit = '/month' THEN 'months'
            ELSE NULL
          END AS duration_unit,
          u.name AS seller_name,
          u.avatar_url AS seller_avatar
        FROM orders o
        JOIN listings l ON o.listing_id = l.id
        JOIN users u ON o.seller_id = u.id
        WHERE o.buyer_id = $1
        ORDER BY o.created_at DESC
      `,
      [req.user.id]
    );

    res.json({ success: true, orders: result.rows.map(formatOrder) });
  } catch (err) {
    console.error('GetMyOrders error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getSellingOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          o.*,
          l.title,
          l.image_url,
          l.category,
          l.location,
          l.price AS listing_price,
          l.price_unit,
          CASE
            WHEN o.type = 'LEASE' AND l.price_unit = '/hour' THEN CEIL(EXTRACT(EPOCH FROM (o.lease_end::timestamp - o.lease_start::timestamp)) / 3600.0)
            WHEN o.type = 'LEASE' AND l.price_unit = '/day' THEN CEIL(EXTRACT(EPOCH FROM (o.lease_end::timestamp - o.lease_start::timestamp)) / 86400.0)
            WHEN o.type = 'LEASE' AND l.price_unit = '/week' THEN CEIL(EXTRACT(EPOCH FROM (o.lease_end::timestamp - o.lease_start::timestamp)) / 604800.0)
            WHEN o.type = 'LEASE' AND l.price_unit = '/month' THEN CEIL(EXTRACT(EPOCH FROM (o.lease_end::timestamp - o.lease_start::timestamp)) / 2592000.0)
            ELSE NULL
          END AS duration_value,
          CASE
            WHEN l.price_unit = '/hour' THEN 'hours'
            WHEN l.price_unit = '/day' THEN 'days'
            WHEN l.price_unit = '/week' THEN 'weeks'
            WHEN l.price_unit = '/month' THEN 'months'
            ELSE NULL
          END AS duration_unit,
          u.name AS buyer_name,
          u.avatar_url AS buyer_avatar
        FROM orders o
        JOIN listings l ON o.listing_id = l.id
        JOIN users u ON o.buyer_id = u.id
        WHERE o.seller_id = $1
        ORDER BY o.created_at DESC
      `,
      [req.user.id]
    );

    res.json({ success: true, orders: result.rows.map(formatOrder) });
  } catch (err) {
    console.error('GetSellingOrders error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = orderResult.rows[0];

    if (order.seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    res.json({ success: true, message: 'Order status updated.', order: result.rows[0] });
  } catch (err) {
    console.error('UpdateOrderStatus error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { createOrder, getMyOrders, getSellingOrders, updateOrderStatus };
