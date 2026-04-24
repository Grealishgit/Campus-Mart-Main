const express = require('express');
const router = express.Router();

// Middleware
const { protect } = require('../middleware/authMiddleware');

// Controllers
const {
  createOrder,
  getMyOrders,
  getSellingOrders,
  updateOrderStatus,
} = require('../controllers/orderController');

// Validation
const validateRequest = require('../middleware/validateRequest');
const {
  createOrderSchema,
  updateOrderStatusSchema,
} = require('../validators/orderValidator');

// Error Handling
const { asyncHandler } = require('../utils/errorHandler');

// ==================== ROUTES ====================

// POST   /api/orders            → place a new order (SALE or LEASE)
router.post(
  '/',
  protect,
  validateRequest(createOrderSchema),
  asyncHandler(createOrder),
);

// GET    /api/orders/buying      → orders where the current user is the buyer
// NOTE: /buying and /selling MUST be declared before /:id/status.
//       Express matches routes top-to-bottom; if a parameterised route like
//       /:id/status were above these, the literal strings "buying" and "selling"
//       would be captured as :id values and the wrong handler would run.
router.get('/buying', protect, asyncHandler(getMyOrders));
router.get('/selling', protect, asyncHandler(getSellingOrders));

// PATCH  /api/orders/:id/status → update order status (seller/admin/buyer-cancel)
// Changed from PUT → PATCH: we are updating a single field (status), not
// replacing the entire order resource, so PATCH is semantically correct.
router.patch(
  '/:id/status',
  protect,
  validateRequest(updateOrderStatusSchema),
  asyncHandler(updateOrderStatus),
);

module.exports = router;