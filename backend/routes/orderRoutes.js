
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
    createOrder,
    getMyOrders,
    getSellingOrders,
    updateOrderStatus
} = require('../controllers/orderController');

router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/selling', protect, getSellingOrders);
router.put('/:id/status', protect, updateOrderStatus);

module.exports = router;