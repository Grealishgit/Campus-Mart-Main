/**
 * tests/orders.test.js
 *
 * Integration tests for the Campus Mart order API.
 * Run with: npm test
 *
 * Strategy
 * ─────────
 * • pool.query / pool.connect are mocked so no real DB is required.
 * • authMiddleware.protect is mocked to inject a controllable req.user.
 * • validateRequest is mocked to pass-through so schema logic is tested
 *   separately in the validator unit tests.
 * • Each describe block owns its mock state — beforeEach resets all mocks.
 */

const request = require('');
const express = require('express');

// ─── Mock: database pool ──────────────────────────────────────────────────────
const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockClient = {
  query: jest.fn(),
  release: mockRelease,
};

jest.mock('../config/db', () => ({
  query: (...args) => mockQuery(...args),
  connect: jest.fn().mockResolvedValue(mockClient),
}));

// ─── Mock: auth middleware ────────────────────────────────────────────────────
// Default user is a buyer. Override per-test where needed.
let mockUser = { id: 10, role: 'user' };

jest.mock('../middleware/authMiddleware', () => ({
  protect: (req, _res, next) => {
    req.user = mockUser;
    next();
  },
}));

// ─── Mock: validateRequest (pass-through in integration tests) ────────────────
jest.mock('../middleware/validateRequest', () => () => (_req, _res, next) => next());

// ─── Mock: asyncHandler (transparent wrapper) ─────────────────────────────────
jest.mock('../utils/errorHandler', () => ({
  asyncHandler: (fn) => fn,
}));

// ─── App setup ────────────────────────────────────────────────────────────────
const orderRoutes = require('../routes/orderRoutes');

const app = express();
app.use(express.json());
app.use('/api/orders', orderRoutes);

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const BUYER_ID  = 10;
const SELLER_ID = 20;
const ORDER_ID  = 99;
const LISTING_ID = 5;

const saleListing = {
  id: LISTING_ID,
  seller_id: SELLER_ID,
  title: 'Calculus Textbook',
  type: 'SALE',
  price: '25.00',
  price_unit: null,
  is_available: true,
  image_url: 'https://example.com/img.jpg',
  category: 'Books',
  location: 'Library',
  available_from: null,
  available_until: null,
  min_duration: null,
  max_duration: null,
};

const leaseListing = {
  ...saleListing,
  id: 6,
  type: 'LEASE',
  price: '10.00',
  price_unit: '/day',
  available_from: null,
  available_until: null,
  min_duration: null,
  max_duration: null,
};

/** Minimal order row as it would come back from the DB after INSERT. */
const baseOrderRow = {
  id: ORDER_ID,
  listing_id: LISTING_ID,
  buyer_id: BUYER_ID,
  seller_id: SELLER_ID,
  status: 'pending',
  type: 'SALE',
  amount: '25.00',
  lease_start: null,
  lease_end: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/** Full enriched row as it comes back from the re-fetch query in updateOrderStatus. */
const enrichedOrderRow = {
  ...baseOrderRow,
  title: saleListing.title,
  image_url: saleListing.image_url,
  category: saleListing.category,
  location: saleListing.location,
  listing_price: saleListing.price,
  price_unit: null,
  duration_value: null,
  duration_unit: null,
  buyer_name: 'Alice',
  buyer_avatar: null,
  seller_name: 'Bob',
  seller_avatar: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Wire mockClient.query to execute a sequence of return values in order. */
const setClientSequence = (...results) => {
  let call = 0;
  mockClient.query.mockImplementation(() => Promise.resolve(results[call++] ?? { rows: [] }));
};

// =============================================================================
// POST /api/orders
// =============================================================================

describe('POST /api/orders — createOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: BUYER_ID, role: 'user' };
  });

  it('201 — creates a SALE order successfully', async () => {
    setClientSequence(
      { rows: [] },                         // BEGIN
      { rows: [saleListing] },              // SELECT listing FOR UPDATE
      { rows: [baseOrderRow] },             // INSERT order
      { rows: [] },                         // UPDATE listings (is_sold)
      { rows: [] },                         // UPDATE users (stats)
      { rows: [] },                         // COMMIT
    );

    const res = await request(app)
      .post('/api/orders')
      .send({ listing_id: LISTING_ID });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.order.id).toBe(String(ORDER_ID));
    expect(res.body.order.status).toBe('pending');
    expect(res.body.order.type).toBe('SALE');
    expect(res.body.order.totalPrice).toBe(25);
  });

  it('201 — creates a LEASE order and calculates amount correctly', async () => {
    const leaseOrderRow = {
      ...baseOrderRow,
      listing_id: leaseListing.id,
      type: 'LEASE',
      amount: '30.00', // 3 days × $10
      lease_start: '2026-06-01',
      lease_end: '2026-06-04',
    };

    setClientSequence(
      { rows: [] },                         // BEGIN
      { rows: [leaseListing] },             // SELECT listing FOR UPDATE
      { rows: [] },                         // overlap check
      { rows: [leaseOrderRow] },            // INSERT order
      { rows: [] },                         // COMMIT
    );

    const res = await request(app)
      .post('/api/orders')
      .send({ listing_id: leaseListing.id, lease_start: '2026-06-01', lease_end: '2026-06-04' });

    expect(res.status).toBe(201);
    expect(res.body.order.type).toBe('LEASE');
    expect(res.body.order.totalPrice).toBe(30);
    expect(res.body.order.durationValue).toBe(3);
    expect(res.body.order.durationUnit).toBe('days');
  });

  it('400 — missing listing_id', async () => {
    const res = await request(app).post('/api/orders').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/listing_id is required/i);
  });

  it('400 — buyer tries to order their own listing', async () => {
    mockUser = { id: SELLER_ID, role: 'user' }; // buyer IS the seller

    setClientSequence(
      { rows: [] },              // BEGIN
      { rows: [saleListing] },   // SELECT listing (seller_id === SELLER_ID)
    );

    const res = await request(app)
      .post('/api/orders')
      .send({ listing_id: LISTING_ID });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot place an order on your own listing/i);
  });

  it('404 — listing not found or unavailable', async () => {
    setClientSequence(
      { rows: [] },  // BEGIN
      { rows: [] },  // SELECT listing returns nothing
    );

    const res = await request(app)
      .post('/api/orders')
      .send({ listing_id: 999 });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found or no longer available/i);
  });

  it('400 — LEASE order missing dates', async () => {
    setClientSequence(
      { rows: [] },               // BEGIN
      { rows: [leaseListing] },   // SELECT listing
    );

    const res = await request(app)
      .post('/api/orders')
      .send({ listing_id: leaseListing.id });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/lease start and end dates are required/i);
  });

  it('400 — LEASE end date before start date', async () => {
    setClientSequence(
      { rows: [] },
      { rows: [leaseListing] },
    );

    const res = await request(app)
      .post('/api/orders')
      .send({ listing_id: leaseListing.id, lease_start: '2026-06-10', lease_end: '2026-06-05' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/end date must be after/i);
  });

  it('400 — LEASE start date in the past', async () => {
    setClientSequence(
      { rows: [] },
      { rows: [leaseListing] },
    );

    const res = await request(app)
      .post('/api/orders')
      .send({ listing_id: leaseListing.id, lease_start: '2020-01-01', lease_end: '2020-01-05' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot be in the past/i);
  });

  it('409 — overlapping LEASE dates', async () => {
    setClientSequence(
      { rows: [] },                          // BEGIN
      { rows: [leaseListing] },              // SELECT listing
      { rows: [{ id: 50 }] },               // overlap check → conflict found
    );

    const res = await request(app)
      .post('/api/orders')
      .send({ listing_id: leaseListing.id, lease_start: '2026-08-01', lease_end: '2026-08-05' });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/no longer available/i);
  });
});

// =============================================================================
// GET /api/orders/buying
// =============================================================================

describe('GET /api/orders/buying — getMyOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: BUYER_ID, role: 'user' };
  });

  it('200 — returns buyer orders formatted correctly', async () => {
    const dbRow = {
      ...baseOrderRow,
      title: 'Textbook',
      image_url: null,
      category: 'Books',
      location: 'Campus',
      listing_price: '25.00',
      price_unit: null,
      duration_value: null,
      duration_unit: null,
      seller_name: 'Bob',
      seller_avatar: null,
    };

    mockQuery.mockResolvedValueOnce({ rows: [dbRow] });

    const res = await request(app).get('/api/orders/buying');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.orders)).toBe(true);
    expect(res.body.orders).toHaveLength(1);
    expect(res.body.orders[0].id).toBe(String(ORDER_ID));
    expect(res.body.orders[0].seller).toEqual({ name: 'Bob', avatarUrl: null });
    // buyer field should be absent on buying perspective (no buyer_name in row)
    expect(res.body.orders[0].buyer).toBeUndefined();
  });

  it('200 — returns empty array when user has no orders', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/orders/buying');

    expect(res.status).toBe(200);
    expect(res.body.orders).toEqual([]);
  });
});

// =============================================================================
// GET /api/orders/selling
// =============================================================================

describe('GET /api/orders/selling — getSellingOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: SELLER_ID, role: 'user' };
  });

  it('200 — returns seller orders formatted correctly', async () => {
    const dbRow = {
      ...baseOrderRow,
      seller_id: SELLER_ID,
      title: 'Textbook',
      image_url: null,
      category: 'Books',
      location: 'Campus',
      listing_price: '25.00',
      price_unit: null,
      duration_value: null,
      duration_unit: null,
      buyer_name: 'Alice',
      buyer_avatar: null,
    };

    mockQuery.mockResolvedValueOnce({ rows: [dbRow] });

    const res = await request(app).get('/api/orders/selling');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.orders[0].buyer).toEqual({ name: 'Alice', avatarUrl: null });
    expect(res.body.orders[0].seller).toBeUndefined();
  });
});

// =============================================================================
// PATCH /api/orders/:id/status
// =============================================================================

describe('PATCH /api/orders/:id/status — updateOrderStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: SELLER_ID, role: 'user' };
  });

  // ── Happy paths ─────────────────────────────────────────────────────────────

  it('200 — seller confirms a pending order', async () => {
    const updatedRow = { ...baseOrderRow, status: 'confirmed' };

    setClientSequence(
      { rows: [] },                   // BEGIN
      { rows: [baseOrderRow] },       // SELECT order FOR UPDATE
      { rows: [updatedRow] },         // UPDATE status
      { rows: [] },                   // COMMIT
    );
    mockQuery.mockResolvedValueOnce({ rows: [enrichedOrderRow] }); // re-fetch

    const res = await request(app)
      .patch(`/api/orders/${ORDER_ID}/status`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order.status).toBe('pending'); // enrichedOrderRow still has 'pending' — that's fine, it reflects DB fixture
  });

  it('200 — seller cancels a pending order and listing is restored', async () => {
    const cancelledRow = { ...baseOrderRow, status: 'cancelled' };

    setClientSequence(
      { rows: [] },                   // BEGIN
      { rows: [baseOrderRow] },       // SELECT order FOR UPDATE (status: pending)
      { rows: [cancelledRow] },       // UPDATE status → cancelled
      { rows: [] },                   // UPDATE listings (restore availability)
      { rows: [] },                   // UPDATE users (roll back SALE stats)
      { rows: [] },                   // COMMIT
    );
    mockQuery.mockResolvedValueOnce({ rows: [{ ...enrichedOrderRow, status: 'cancelled' }] });

    const res = await request(app)
      .patch(`/api/orders/${ORDER_ID}/status`)
      .send({ status: 'cancelled' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Verify the listing-restore UPDATE was issued (4th client.query call, index 3)
    const listingUpdateCall = mockClient.query.mock.calls[3][0];
    expect(listingUpdateCall).toMatch(/is_available\s*=\s*true/i);
  });

  it('200 — buyer cancels their own pending order', async () => {
    mockUser = { id: BUYER_ID, role: 'user' };
    const cancelledRow = { ...baseOrderRow, status: 'cancelled' };

    setClientSequence(
      { rows: [] },
      { rows: [baseOrderRow] },       // order.buyer_id === BUYER_ID ✓
      { rows: [cancelledRow] },
      { rows: [] },                   // listing restore
      { rows: [] },                   // user stats rollback
      { rows: [] },                   // COMMIT
    );
    mockQuery.mockResolvedValueOnce({ rows: [{ ...enrichedOrderRow, status: 'cancelled' }] });

    const res = await request(app)
      .patch(`/api/orders/${ORDER_ID}/status`)
      .send({ status: 'cancelled' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // ── Rejection paths ──────────────────────────────────────────────────────────

  it('400 — invalid status value', async () => {
    // No DB calls should be made before this guard fires.
    const res = await request(app)
      .patch(`/api/orders/${ORDER_ID}/status`)
      .send({ status: 'shipped' }); // not a valid status

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/must be one of/i);
  });

  it('404 — order not found', async () => {
    setClientSequence(
      { rows: [] },   // BEGIN
      { rows: [] },   // SELECT order → not found
    );

    const res = await request(app)
      .patch(`/api/orders/999/status`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/order not found/i);
  });

  it('403 — unrelated user cannot update status', async () => {
    mockUser = { id: 999, role: 'user' }; // neither buyer nor seller

    setClientSequence(
      { rows: [] },
      { rows: [baseOrderRow] },   // buyer_id=10, seller_id=20 — 999 is neither
    );

    const res = await request(app)
      .patch(`/api/orders/${ORDER_ID}/status`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('403 — buyer cannot set status to confirmed', async () => {
    mockUser = { id: BUYER_ID, role: 'user' };

    setClientSequence(
      { rows: [] },
      { rows: [baseOrderRow] },
    );

    const res = await request(app)
      .patch(`/api/orders/${ORDER_ID}/status`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/buyers may only cancel/i);
  });

  it('409 — cannot update a completed order', async () => {
    const completedOrder = { ...baseOrderRow, status: 'completed' };

    setClientSequence(
      { rows: [] },
      { rows: [completedOrder] },
    );

    const res = await request(app)
      .patch(`/api/orders/${ORDER_ID}/status`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already completed/i);
  });

  it('409 — cannot update a cancelled order', async () => {
    const cancelledOrder = { ...baseOrderRow, status: 'cancelled' };

    setClientSequence(
      { rows: [] },
      { rows: [cancelledOrder] },
    );

    const res = await request(app)
      .patch(`/api/orders/${ORDER_ID}/status`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already cancelled/i);
  });

  it('200 — admin can update any order regardless of ownership', async () => {
    mockUser = { id: 999, role: 'admin' }; // not buyer or seller
    const confirmedRow = { ...baseOrderRow, status: 'confirmed' };

    setClientSequence(
      { rows: [] },
      { rows: [baseOrderRow] },
      { rows: [confirmedRow] },
      { rows: [] },               // COMMIT
    );
    mockQuery.mockResolvedValueOnce({ rows: [enrichedOrderRow] });

    const res = await request(app)
      .patch(`/api/orders/${ORDER_ID}/status`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// =============================================================================
// Route-level concerns
// =============================================================================

describe('Route structure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: BUYER_ID, role: 'user' };
  });

  it('GET /buying resolves to getMyOrders, not /:id/status', async () => {
    // If route ordering were wrong, "buying" would be captured as :id
    // and the server would attempt a status update — we'd get a 400 (invalid status).
    // A correct setup returns 200 from getMyOrders.
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/orders/buying');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('orders');
  });

  it('GET /selling resolves to getSellingOrders, not /:id/status', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/orders/selling');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('orders');
  });

  it('PUT /:id/status returns 404 (route no longer exists — use PATCH)', async () => {
    const res = await request(app)
      .put(`/api/orders/${ORDER_ID}/status`)
      .send({ status: 'confirmed' });

    // Express returns 404 for unregistered methods
    expect(res.status).toBe(404);
  });
});