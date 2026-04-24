const express = require('express');
const router = express.Router();

// Controllers
const {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  changePassword,
  deleteAccount,
  logoutUser,
  verifyEmail,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

// Middleware
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Validation & Rate Limiting
const validateRequest = require('../middleware/validateRequest');
// const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');

// Validators
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  refreshTokenSchema,
} = require('../validators/authValidator');

// Error Handling
const { asyncHandler } = require('../utils/errorHandler');

// ==================== ROUTES ====================

// Public routes
router.post('/register', validateRequest(registerSchema), asyncHandler(registerUser));
// router.post('/login', authLimiter, validateRequest(loginSchema), asyncHandler(loginUser));
router.post('/login', validateRequest(loginSchema), asyncHandler(loginUser));
router.post('/verify-email', validateRequest(verifyEmailSchema), asyncHandler(verifyEmail));
router.post('/refresh', validateRequest(refreshTokenSchema), asyncHandler(refreshAccessToken));
router.post('/forgot-password', validateRequest(forgotPasswordSchema), asyncHandler(forgotPassword));
router.post('/reset-password', validateRequest(resetPasswordSchema), asyncHandler(resetPassword));

// Protected routes
router.get('/me', protect, asyncHandler(getCurrentUser));
router.put('/profile', protect, upload.single('avatar'), validateRequest(updateProfileSchema), asyncHandler(updateProfile));
router.post('/change-password', protect, validateRequest(changePasswordSchema), asyncHandler(changePassword));
router.post('/logout', protect, asyncHandler(logoutUser));
router.delete('/account', protect, asyncHandler(deleteAccount));

module.exports = router;
