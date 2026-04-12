// favorites routes
const express = require('express');
const favRouter = express.Router();
const { getFavorites, addFavorite, removeFavorite } = require('../controllers/favoritesController');
const { protect } = require('../middleware/authMiddleware');

favRouter.get('/', protect, getFavorites);
favRouter.post('/:listingId', protect, addFavorite);
favRouter.delete('/:listingId', protect, removeFavorite);

// orders routes
const orderRouter = express.Router();
const { createOrder, getMyOrders, getSellingOrders, updateOrderStatus } = require('../controllers/orderController');

orderRouter.post('/', protect, createOrder);
orderRouter.get('/my', protect, getMyOrders);
orderRouter.get('/selling', protect, getSellingOrders);
orderRouter.put('/:id/status', protect, updateOrderStatus);

// chat routes
const chatRouter = express.Router();
const { getConversations, startConversation, getMessages, sendMessage } = require('../controllers/chatController');

chatRouter.get('/', protect, getConversations);
chatRouter.post('/start', protect, startConversation);
chatRouter.get('/:conversationId/messages', protect, getMessages);
chatRouter.post('/:conversationId/messages', protect, sendMessage);

// admin routes
const adminRouter = express.Router();
const { loginAdmin, getStats, getAllUsers, verifyUser, deleteUser, getAllListings, verifyListing } = require('../controllers/adminController');
const { adminOnly } = require('../middleware/authMiddleware');

adminRouter.post('/login', loginAdmin);
adminRouter.use(protect, adminOnly);
adminRouter.get('/stats', getStats);
adminRouter.get('/users', getAllUsers);
adminRouter.put('/users/:id/verify', verifyUser);
adminRouter.delete('/users/:id', deleteUser);
adminRouter.get('/listings', getAllListings);
adminRouter.put('/listings/:id/verify', verifyListing);

module.exports = { favRouter, orderRouter, chatRouter, adminRouter };
