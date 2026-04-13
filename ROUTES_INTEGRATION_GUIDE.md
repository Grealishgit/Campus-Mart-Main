# Quick Integration Guide: Adding Validators to Routes

## Step 1: Update Auth Routes

**File:** `backend/routes/authRoutes.js`

Add these imports at the top:

```javascript
const express = require('express');
const router = express.Router();
const validateRequest = require('../middleware/validateRequest');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  refreshTokenSchema,
} = require('../validators/authValidator');
const { asyncHandler } = require('../utils/errorHandler');

// Import your controllers
const {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  deleteAccount,
  verifyEmail,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  logoutUser,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware').upload;
```

Then Update each route. Example:

**BEFORE:**
```javascript
router.post('/register', registerUser);
```

**AFTER:**
```javascript
router.post('/register', registerLimiter, validateRequest(registerSchema), asyncHandler(registerUser));
```

## Complete Updated Routes

Replace the entire `router` section with:

```javascript
// Public routes
router.post('/register', registerLimiter, validateRequest(registerSchema), asyncHandler(registerUser));
router.post('/login', authLimiter, validateRequest(loginSchema), asyncHandler(loginUser));
router.post('/verify-email', validateRequest(verifyEmailSchema), asyncHandler(verifyEmail));
router.post('/refresh', validateRequest(refreshTokenSchema), asyncHandler(refreshAccessToken));
router.post('/forgot-password', validateRequest(forgotPasswordSchema), asyncHandler(forgotPassword));
router.post('/reset-password', validateRequest(resetPasswordSchema), asyncHandler(resetPassword));

// Protected routes
router.get('/me', protect, asyncHandler(getCurrentUser));
router.put('/profile', protect, upload.single('avatar'), validateRequest(updateProfileSchema), asyncHandler(updateProfile));
router.post('/logout', protect, asyncHandler(logoutUser));
router.delete('/account', protect, asyncHandler(deleteAccount));

module.exports = router;
```

---

## Step 2: Update Listing Routes

**File:** `backend/routes/listingRoutes.js`

Add imports:
```javascript
const validateRequest = require('../middleware/validateRequest');
const { listingLimiter } = require('../middleware/rateLimiter');
const {
  createListingSchema,
  updateListingSchema,
  getListingsSchema,
} = require('../validators/listingValidator');
const { asyncHandler } = require('../utils/errorHandler');
```

Update routes:
```javascript
router.get('/', validateRequest(getListingsSchema), asyncHandler(getListings));
router.get('/:id', asyncHandler(getListingById));
router.post('/', protect, listingLimiter, upload.single('image'), 
  validateRequest(createListingSchema), asyncHandler(createListing));
router.put('/:id', protect, upload.single('image'),
  validateRequest(updateListingSchema), asyncHandler(updateListing));
router.delete('/:id', protect, asyncHandler(deleteListing));
router.get('/user/my-listings', protect, asyncHandler(getUserListings));
router.get('/categories/list', asyncHandler(getCategories));
```

---

## Step 3: Update Order Routes

**File:** `backend/routes/orderRoutes.js`

Add imports:
```javascript
const validateRequest = require('../middleware/validateRequest');
const {
  createOrderSchema,
  updateOrderStatusSchema,
} = require('../validators/orderValidator');
const { asyncHandler } = require('../utils/errorHandler');
```

Update routes:
```javascript
router.post('/', protect, validateRequest(createOrderSchema), asyncHandler(createOrder));
router.get('/my', protect, asyncHandler(getUserOrders));
router.get('/selling', protect, asyncHandler(getSellingOrders));
router.put('/:id/status', protect, validateRequest(updateOrderStatusSchema), asyncHandler(updateOrderStatus));
router.get('/:id', protect, asyncHandler(getOrderById));
```

---

## Step 4: Update Chat Routes

**File:** `backend/routes/chatRoutes.js`

Add imports:
```javascript
const validateRequest = require('../middleware/validateRequest');
const { messageLimiter } = require('../middleware/rateLimiter');
const {
  startConversationSchema,
  sendMessageSchema,
  getMessagesSchema,
} = require('../validators/chatValidator');
const { asyncHandler } = require('../utils/errorHandler');
```

Update routes:
```javascript
router.get('/', protect, asyncHandler(getConversations));
router.post('/start', protect, validateRequest(startConversationSchema), asyncHandler(startConversation));
router.get('/:conversationId/messages', protect, validateRequest(getMessagesSchema), asyncHandler(getMessages));
router.post('/:conversationId/messages', protect, messageLimiter,
  validateRequest(sendMessageSchema), asyncHandler(sendMessage));
```

---

## Step 5: Update Favorite Routes

**File:** `backend/routes/favouriteRoutes.js`

Add imports:
```javascript
const validateRequest = require('../middleware/validateRequest');
const { asyncHandler } = require('../utils/errorHandler');
const { z } = require('zod');

const addFavoriteSchema = z.object({
  params: z.object({
    listingId: z.coerce.number().int().positive(),
  }),
});

const removeFavoriteSchema = z.object({
  params: z.object({
    listingId: z.coerce.number().int().positive(),
  }),
});
```

Update routes:
```javascript
router.get('/', protect, asyncHandler(getFavorites));
router.post('/:listingId', protect, validateRequest(addFavoriteSchema), asyncHandler(addFavorite));
router.delete('/:listingId', protect, validateRequest(removeFavoriteSchema), asyncHandler(removeFavorite));
```

---

## Step 6: Update Controllers

**Important:** Wrap all controller functions with `asyncHandler` to catch errors.

### Before:
```javascript
const registerUser = (req, res) => {
  try {
    const { name, email, password } = req.body;
    // ... rest of logic
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
```

### After:
```javascript
const { AppError, asyncHandler } = require('../utils/errorHandler');

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  
  // Check if user exists
  const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    throw new AppError('Email already registered', 400, 'EMAIL_EXISTS');
  }
  
  // ... rest of logic
  // No try-catch needed - errors are caught by asyncHandler
});
```

### Error Handling in Controllers

Instead of error handling blocks, throw `AppError`:

```javascript
// Bad:
if (!user) {
  return res.status(404).json({ success: false, message: 'User not found' });
}

// Good:
if (!user) {
  throw new AppError('User not found', 404, 'USER_NOT_FOUND');
}
```

---

## Testing After Updates

### 1. Test a registration with invalid email:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "invalid-email",
    "password": "ValidPass123!"
  }'

# Expected response:
# {
#   "success": false,
#   "error_code": "VALIDATION_ERROR",
#   "message": "Invalid request data",
#   "details": [{ "path": "body.email", "message": "Must be a university email" }]
# }
```

### 2. Test rate limiting on login:
```bash
# Send 6 requests quickly
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.ac.ke","password":"wrong"}'
done

# 6th should be rate limited with 429 status
```

### 3. Test error handling:
```bash
# Missing required field
curl -X POST http://localhost:5000/api/listings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test"}'

# Expected 400 with validation errors
```

---

## Checklist for Implementation

- [ ] Add imports to authRoutes.js
- [ ] Update all auth routes with validation and rate limiting
- [ ] Update authController functions - wrap with asyncHandler
- [ ] Update authController error handling - throw AppError
- [ ] Repeat for listingRoutes.js
- [ ] Repeat for orderRoutes.js
- [ ] Repeat for chatRoutes.js
- [ ] Repeat for favouriteRoutes.js
- [ ] Test each endpoint with curl/Postman
- [ ] Verify validation errors return 400
- [ ] Verify rate limiting returns 429 after limit
- [ ] Check error messages don't expose details
- [ ] Run `npm start` and verify server starts

---

## Tips

1. **Use asyncHandler** for all async controller functions
2. **Throw AppError** instead of res.status().json()
3. **Validation happens automatically** - validators ensure valid data
4. **Rate limiting is applied per route** - configure in middleware/rateLimiter.js
5. **Test after each route** - don't wait until end to test all

