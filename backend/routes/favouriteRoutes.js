const express = require('express');
const router = express.Router();
const { z } = require('zod');

// Middleware
const { protect } = require('../middleware/authMiddleware');

// Controllers
const { getFavorites, addFavorite, removeFavorite } = require('../controllers/favoritesController');

// Validation
const validateRequest = require('../middleware/validateRequest');

// Validator for listing ID parameter
const listingIdSchema = z.object({
  params: z.object({
    listingId: z.coerce.number().int().positive('Invalid listing ID'),
  }),
});

// Error Handling
const { asyncHandler } = require('../utils/errorHandler');

// ==================== ROUTES ====================

router.get('/', protect, asyncHandler(getFavorites));
router.post('/:listingId', protect, validateRequest(listingIdSchema), asyncHandler(addFavorite));
router.delete('/:listingId', protect, validateRequest(listingIdSchema), asyncHandler(removeFavorite));

module.exports = router;