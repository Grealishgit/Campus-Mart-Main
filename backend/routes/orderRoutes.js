const express = require('express');
const router = express.Router();

// Middleware
const { protect } = require('../middleware/authMiddleware');

// Controllers
const {
    createOrder,
    getMyOrders,
    getSellingOrders,
    updateOrderStatus
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

router.post('/', protect, validateRequest(createOrderSchema), asyncHandler(createOrder));
router.get('/my', protect, asyncHandler(getMyOrders));
router.get('/selling', protect, asyncHandler(getSellingOrders));
router.put('/:id/status', protect, validateRequest(updateOrderStatusSchema), asyncHandler(updateOrderStatus));

module.exports = router;