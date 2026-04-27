const express = require('express');
const router = express.Router();

// Middleware
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Controllers
const {
    loginAdmin,
    getStats,
    getOrders,
    getAllUsers,
    verifyUser,
    deleteUser,
    getAllListings,
    verifyListing,
    getLogs
} = require('../controllers/adminController');

// Validation
const validateRequest = require('../middleware/validateRequest');

// Error Handling
const { asyncHandler } = require('../utils/errorHandler');

// ==================== ROUTES ====================

router.post('/login', asyncHandler(loginAdmin));
router.use(protect, adminOnly);
router.get('/stats', asyncHandler(getStats));
router.get('/users', asyncHandler(getAllUsers));
router.put('/users/:id/verify', asyncHandler(verifyUser));
router.delete('/users/:id', asyncHandler(deleteUser));
router.get('/listings', asyncHandler(getAllListings));
router.put('/listings/:id/verify', asyncHandler(verifyListing));
router.get('/orders', asyncHandler(getOrders));
router.get('/logs', asyncHandler(getLogs));


module.exports = router;      