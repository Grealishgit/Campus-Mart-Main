# 🚀 NEXT ACTIONS - Phase 1 Integration (Copy-Paste Ready)

**⏰ Time to Complete:** 2-3 hours  
**Difficulty:** Easy (mostly copy-paste)  
**Prerequisites:** npm install completed

---

## ✅ Action 1: Update Backend/Routes/AuthRoutes.js

### Current file line count: ~30 lines  
### Add these 20 lines to the top:

```javascript
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
const { AppError } = require('../utils/errorHandler');
```

### Replace the route definitions with:

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

## ✅ Action 2: Update Backend/Controllers/AuthController.js

### Add import at top:
```javascript
const { AppError, asyncHandler } = require('../utils/errorHandler');
const crypto = require('crypto');
```

### Example: Wrap registerUser function

**Before:**
```javascript
const registerUser = (req, res) => {
  try {
    const { name, email, password } = req.body;
    // ... logic
    res.json({ success: true, ... });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
```

**After:**
```javascript
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  
  // Check if user exists
  const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    throw new AppError('Email already registered', 400, 'EMAIL_EXISTS');
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create user
  const result = await pool.query(
    'INSERT INTO users (name, email, password, faculty) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role',
    [name, email, hashedPassword, req.body.faculty]
  );
  
  const user = result.rows[0];
  
  // Generate JWT tokens
  const accessToken = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  res.status(201).json({
    success: true,
    message: 'Registration successful! Check your email to verify.',
    data: {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken,
    },
  });
});
```

**Key Changes:**
- Wrap function với `asyncHandler`
- Remove try-catch block
- Use `throw new AppError()` instead of res.status().json()
- No need to call next() for errors

### Apply same pattern to these functions:
- [ ] loginUser
- [ ] getCurrentUser
- [ ] updateProfile
- [ ] deleteAccount
- [ ] (new) verifyEmail
- [ ] (new) refreshAccessToken
- [ ] (new) forgotPassword
- [ ] (new) resetPassword
- [ ] (new) logoutUser

---

## ✅ Action 3: Update Listing Routes

### File: `backend/routes/listingRoutes.js`

**Add imports:**
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

**Replace routes:**
```javascript
router.get('/', validateRequest(getListingsSchema), asyncHandler(getListings));
router.get('/categories', asyncHandler(getCategories));
router.get('/:id', asyncHandler(getListingById));
router.post('/', protect, listingLimiter, upload.single('image'), validateRequest(createListingSchema), asyncHandler(createListing));
router.put('/:id', protect, upload.single('image'), validateRequest(updateListingSchema), asyncHandler(updateListing));
router.delete('/:id', protect, asyncHandler(deleteListing));
router.get('/user/my-listings', protect, asyncHandler(getUserListings));

module.exports = router;
```

---

## ✅ Action 4: Update Order Routes

### File: `backend/routes/orderRoutes.js`

**Add imports:**
```javascript
const validateRequest = require('../middleware/validateRequest');
const {
  createOrderSchema,
  updateOrderStatusSchema,
} = require('../validators/orderValidator');
const { asyncHandler } = require('../utils/errorHandler');
```

**Replace routes:**
```javascript
router.get('/', protect, asyncHandler(getOrders));
router.post('/', protect, validateRequest(createOrderSchema), asyncHandler(createOrder));
router.get('/my', protect, asyncHandler(getUserOrders));
router.get('/selling', protect, asyncHandler(getSellingOrders));
router.get('/:id', protect, asyncHandler(getOrderById));
router.put('/:id/status', protect, validateRequest(updateOrderStatusSchema), asyncHandler(updateOrderStatus));

module.exports = router;
```

---

## ✅ Action 5: Update Chat Routes

### File: `backend/routes/chatRoutes.js`

**Add imports:**
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

**Replace routes:**
```javascript
router.get('/', protect, asyncHandler(getConversations));
router.post('/start', protect, validateRequest(startConversationSchema), asyncHandler(startConversation));
router.get('/:conversationId/messages', protect, validateRequest(getMessagesSchema), asyncHandler(getMessages));
router.post('/:conversationId/messages', protect, messageLimiter, validateRequest(sendMessageSchema), asyncHandler(sendMessage));

module.exports = router;
```

---

## ✅ Action 6: Update Favorites Routes

### File: `backend/routes/favouriteRoutes.js`

**Add imports:**
```javascript
const validateRequest = require('../middleware/validateRequest');
const { asyncHandler } = require('../utils/errorHandler');
const { z } = require('zod');

const listingIdSchema = z.object({
  params: z.object({
    listingId: z.coerce.number().int().positive('Invalid listing ID'),
  }),
});
```

**Replace routes:**
```javascript
router.get('/', protect, asyncHandler(getFavorites));
router.post('/:listingId', protect, validateRequest(listingIdSchema), asyncHandler(addFavorite));
router.delete('/:listingId', protect, validateRequest(listingIdSchema), asyncHandler(removeFavorite));

module.exports = router;
```

---

## ✅ Action 7: Test Everything

### Test 1: Verify Server Starts
```bash
cd backend
npm run dev

# Should show:
# Campus Mart API running on http://localhost:5000
# Environment: development
```

### Test 2: Validation Works (should fail)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "A",
    "email": "not-email",
    "password": "weak"
  }'

# Should return 400 with validation errors
```

### Test 3: Valid Request Works (should succeed)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@university.ac.ke",
    "password": "SecurePass123!"
  }'

# Should return 201 with success message
```

### Test 4: Rate Limiting Works (should fail on 6th)
```bash
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.ac.ke","password":"wrong"}'
  echo "Request $i sent"
  sleep 0.5
done

# Last request should return 429 Too Many Requests
```

---

## 📋 Completion Checklist

### Route Files Updated
- [ ] authRoutes.js - Add validation & rate limiting
- [ ] listingRoutes.js - Add validation & rate limiting  
- [ ] orderRoutes.js - Add validation
- [ ] chatRoutes.js - Add validation & rate limiting
- [ ] favouriteRoutes.js - Add validation
- [ ] adminRoutes.js (optional) - Add validation

### Controllers Updated
- [ ] authController.js - Wrap with asyncHandler
- [ ] listingController.js - Wrap with asyncHandler
- [ ] orderController.js - Wrap with asyncHandler
- [ ] chatController.js - Wrap with asyncHandler
- [ ] favoritesController.js - Wrap with asyncHandler
- [ ] adminController.js (optional) - Wrap with asyncHandler

### Testing Completed
- [ ] Server starts without errors
- [ ] Invalid data returns 400 with validation errors
- [ ] Valid data processes normally
- [ ] Rate limiting blocks after threshold
- [ ] Error messages don't expose sensitive info
- [ ] Logging shows request details

### Documentation
- [ ] README.md updated with new env vars
- [ ] Phase 1 documented in PHASE_1_PROGRESS.md
- [ ] Developers briefed on new error handling

---

## 💡 Quick Tips

1. **Copy errors reduce mistakes** - Use the exact code above
2. **Test after each route file** - Don't update all at once
3. **Controller functions must be async** - Use `asyncHandler`
4. **Validation happens first** - Before reaching controller
5. **Error handling is automatic** - No try-catch needed with asyncHandler

---

## 🎯 Success = All Tests Pass

If you can:
- ✅ Start server without errors
- ✅ Hit /api/auth/register with invalid data and get 400 response
- ✅ Hit /api/auth/register with valid data and get 201 response
- ✅ Trigger rate limiting and get 429 response

**Then Phase 1 is 100% complete!** 🎉

---

## Next: Phase 2 Preview

Once Phase 1 integration is done, Phase 2 will add:
1. Email verification endpoints
2. Password reset endpoints  
3. Refresh token database table
4. Refresh token logic

**Estimated effort:** 4-6 hours

---

**Need help?** Check `ROUTES_INTEGRATION_GUIDE.md` for detailed explanations.
