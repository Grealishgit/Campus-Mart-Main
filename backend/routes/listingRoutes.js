const express = require('express');
const router = express.Router();

// Controllers
const {
  getListings, getListingById, createListing,
  updateListing, deleteListing, getMyListings, getVendorStore, getCategories, getConditions,
  getAIInsights
} = require('../controllers/listingController');

// Middleware
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Validation & Rate Limiting
const validateRequest = require('../middleware/validateRequest');
const { listingLimiter } = require('../middleware/rateLimiter');

// Validators
const {
  createListingSchema,
  updateListingSchema,
  getListingsSchema,
} = require('../validators/listingValidator');

// Error Handling
const { asyncHandler } = require('../utils/errorHandler');

// ==================== ROUTES ====================

router.get('/', validateRequest(getListingsSchema), asyncHandler(getListings));
router.get('/categories', asyncHandler(getCategories));
router.get('/conditions', asyncHandler(getConditions));
router.get('/insights/ai', asyncHandler(getAIInsights));
router.get('/my', protect, asyncHandler(getMyListings));
router.get('/store/:sellerId', asyncHandler(getVendorStore));
router.get('/:id', asyncHandler(getListingById));
router.post('/', protect, listingLimiter, upload.single('image'), validateRequest(createListingSchema), asyncHandler(createListing));
router.put('/:id', protect, upload.single('image'), validateRequest(updateListingSchema), asyncHandler(updateListing));
router.delete('/:id', protect, asyncHandler(deleteListing));

module.exports = router;
