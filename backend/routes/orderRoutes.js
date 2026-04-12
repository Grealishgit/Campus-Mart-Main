
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
    createOrder,
    getMyOrders,
    getSellingOrders,
    updateOrderStatus
} = require('../controllers/order Controller');

orderRouter.post('/', protect, createOrder);
orderRouter.get('/my', protect, getMyOrders);
orderRouter.get('/selling', protect, getSellingOrders);
orderRouter.put('/:id/status', protect, updateOrderStatus);

module.exports = router;