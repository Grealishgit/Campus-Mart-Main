const express = require('express');
const router = express.Router();
const { z } = require('zod');

// Middleware
const { protect } = require('../middleware/authMiddleware');

// Controllers
const { getFavorites, addFavorite, removeFavorite } = require('../controllers/favoritesController');

// Validation
const validateRequest = require('../middleware/validateRequest');

// Error Handling
const { asyncHandler } = require('../utils/errorHandler');

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

// :type must be 'sale' or 'lease'; :listingId must be a positive integer.
const listingParamsSchema = z.object({
  params: z.object({
    type: z.enum(['sale', 'lease'], {
      errorMap: () => ({ message: "type must be 'sale' or 'lease'" }),
    }),
    listingId: z.coerce.number().int().positive('Invalid listing ID'),
  }),
});

// ==================== ROUTES ====================

// GET    /api/favorites                     → all favorites for current user
router.get('/', protect, asyncHandler(getFavorites));

// POST   /api/favorites/:type/:listingId    → add a listing to favorites
// DELETE /api/favorites/:type/:listingId    → remove a listing from favorites
router.post(
  '/:type/:listingId',
  protect,
  validateRequest(listingParamsSchema),
  asyncHandler(addFavorite),
);

router.delete(
  '/:type/:listingId',
  protect,
  validateRequest(listingParamsSchema),
  asyncHandler(removeFavorite),
);

module.exports = router;