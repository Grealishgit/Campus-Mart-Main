const pool = require('../config/db');

// @desc    Place an order (Buy Now)
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { listing_id, lease_start, lease_end } = req.body;

    if (!listing_id) {
      return res.status(400).json({ success: false, message: 'listing_id is required.' });
    }

    // Get listing
    const listingResult = await pool.query(
      'SELECT * FROM listings WHERE id = $1 AND is_available = true',
      [listing_id]
    );

    if (listingResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Listing not found or no longer available.' });
    }

    const listing = listingResult.rows[0];

    // Can't buy your own listing
    if (listing.seller_id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot purchase your own listing.' });
    }

    // Validate lease dates
    if (listing.type === 'LEASE' && (!lease_start || !lease_end)) {
      return res.status(400).json({ success: false, message: 'Lease start and end dates are required for rentals.' });
    }

    // Create order
    const result = await pool.query(
      `INSERT INTO orders (buyer_id, listing_id, seller_id, amount, type, lease_start, lease_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, listing_id, listing.seller_id, listing.price, listing.type, lease_start || null, lease_end || null]
    );

    // Mark listing as unavailable for SALE
    if (listing.type === 'SALE') {
      await pool.query('UPDATE listings SET is_available = false WHERE id = $1', [listing_id]);
      await pool.query(
        'UPDATE users SET total_sales = total_sales + 1, active_listings = GREATEST(active_listings - 1, 0) WHERE id = $1',
        [listing.seller_id]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      order: result.rows[0],
    });
  } catch (err) {
    console.error('CreateOrder error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get my orders (as buyer)
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, l.title, l.image_url, l.category,
              u.name AS seller_name, u.avatar_url AS seller_avatar
       FROM orders o
       JOIN listings l ON o.listing_id = l.id
       JOIN users u ON o.seller_id = u.id
       WHERE o.buyer_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, orders: result.rows });
  } catch (err) {
    console.error('GetMyOrders error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get incoming orders (as seller)
// @route   GET /api/orders/selling
// @access  Private
const getSellingOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, l.title, l.image_url, l.category,
              u.name AS buyer_name, u.avatar_url AS buyer_avatar
       FROM orders o
       JOIN listings l ON o.listing_id = l.id
       JOIN users u ON o.buyer_id = u.id
       WHERE o.seller_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, orders: result.rows });
  } catch (err) {
    console.error('GetSellingOrders error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (seller or admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (order.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.rows[0].seller_id !== req.user.id && req.user.role !== 'admin') {
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
