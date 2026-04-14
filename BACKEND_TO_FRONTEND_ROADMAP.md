# Campus Mart: Backend API Completion & Frontend Integration Roadmap

**Last Updated:** April 13, 2026  
**Current Status:** Backend API 75% complete, Ready for security hardening  
**Estimated Timeline:** 8-10 weeks to production-ready

---

## 🎯 Executive Summary

### Current Backend Status
- ✅ **Database Schema:** 90% complete (8 tables, proper relationships)
- ✅ **API Endpoints:** 85% complete (30+ endpoints coded)
- ⚠️ **Validation:** 30% (only basic checks, needs hardening)
- 🔴 **Security:** 20% (critical issues in CORS, validation, error handling)
- ❌ **Testing:** 0% (no test suite exists)
- ⚠️ **Documentation:** 30% (minimal code comments)

### What's Blocking Frontend Integration?
1. **Security Issues** - Won't deploy with CORS=`*` and no input validation
2. **Error Handling** - Inconsistent error messages and no error codes for frontend
3. **Request Logging** - No way to debug issues in production
4. **Missing Features** - Password reset, email verification, refresh tokens

### Timeline to Production
```
Phase 1: Security & Core Fixes     2-3 weeks  (CRITICAL - start here)
Phase 2: API Polish & Testing      2-3 weeks  (features work, but optimized)
Phase 3: Frontend Integration      2-3 weeks  (connect all screens)
Phase 4: Testing & Deployment      1-2 weeks  (launch ready)
                                    ──────────
Total:                             8-10 weeks (solo dev) / 4-6 weeks (2 devs)
```

---

## 📋 PHASE 1: SECURITY & CRITICAL FIXES (Weeks 1-3)

### Priority 1: Critical Security Issues (Complete ASAP)

These **MUST** be fixed before any testing with real data:

#### 1.1 Fix CORS Configuration ⏱️ 30 minutes
**File:** `backend/server.js` (Line 10)

**Current (VULNERABLE):**
```javascript
app.use(cors({
  origin: '*',  // 🔴 CRITICAL: Anyone can access your API
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

**Action Required:**
```javascript
app.use(cors({
  origin: [
    'http://localhost:5000',      // Local dev
    'http://localhost:8081',      // Expo dev server
    'http://192.168.1.100:8081',  // Mobile dev
    'https://yourdomain.com'      // Production (add when ready)
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));
```

**Testing:**
```bash
# Should fail with 403:
curl -H "Origin: https://attacker.com" http://localhost:5000/api/listings

# Should succeed:
curl -H "Origin: http://localhost:8081" http://localhost:5000/api/listings
```

---

#### 1.2 Add Input Validation Middleware ⏱️ 4 hours
**Package:** Install `zod` (schema validation)
```bash
cd backend && npm install zod
```

**Create:** `backend/middleware/validateRequest.js`
```javascript
const { ZodError } = require('zod');

const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      // Replace request data with validated data
      req.body = validatedData.body;
      req.params = validatedData.params;
      req.query = validatedData.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return res.status(400).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: messages.slice(0, 5), // First 5 errors
        });
      }
      next(error);
    }
  };
};

module.exports = validateRequest;
```

**Create:** `backend/validators/authValidator.js`
```javascript
const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .trim(),
    email: z.string()
      .email('Invalid email format')
      .refine(
        (email) => /^[^\s@]+@[^\s@]+\.(ac\.ke|edu)$/.test(email),
        'Must be a university email (.ac.ke or .edu)'
      ),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[0-9]/, 'Password must contain number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
    faculty: z.string().optional(),
    graduation_year: z.number().int().min(2024).max(2030).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(1, 'Password required'),
  }),
});

const listingSchema = z.object({
  body: z.object({
    title: z.string()
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title cannot exceed 200 characters')
      .trim(),
    description: z.string()
      .min(10, 'Description must be at least 10 characters')
      .max(5000, 'Description cannot exceed 5000 characters')
      .trim(),
    price: z.coerce.number()
      .positive('Price must be positive')
      .finite('Invalid price'),
    type: z.enum(['SALE', 'LEASE'], {
      errorMap: () => ({ message: 'Type must be SALE or LEASE' }),
    }),
    category: z.enum([
      'Textbooks', 'Tech', 'Dorm Decor', 'Bikes',
      'Sports', 'Fashion', 'Other', 'Electronics'
    ], {
      errorMap: () => ({ message: 'Invalid category' }),
    }),
    condition: z.enum(['New', 'Like New', 'Lightly Used', 'Used', 'Fair'], {
      errorMap: () => ({ message: 'Invalid condition' }),
    }),
    location: z.string()
      .min(3, 'Location required')
      .max(200, 'Location too long')
      .trim(),
    price_unit: z.enum(['Per Day', 'Per Week', 'Per Month']).optional(),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  listingSchema,
};
```

**Update Routes:** `backend/routes/authRoutes.js`
```javascript
const validateRequest = require('../middleware/validateRequest');
const { registerSchema, loginSchema } = require('../validators/authValidator');

router.post('/register', 
  validateRequest(registerSchema), 
  register
);

router.post('/login', 
  validateRequest(loginSchema), 
  login
);
```

**Repeat for all other routes** (listings, orders, chats, etc.)

**Checklist:**
- [ ] Create validators directory
- [ ] Create authValidator, listingValidator, orderValidator, chatValidator
- [ ] Apply validation middleware to all POST/PUT endpoints
- [ ] Test with invalid data (should return 400 with details)
- [ ] Test with valid data (should pass through)

---

#### 1.3 Add Rate Limiting ⏱️ 2 hours
**Package:** Install `express-rate-limit`
```bash
npm install express-rate-limit
```

**Create:** `backend/middleware/rateLimit.js`
```javascript
const rateLimit = require('express-rate-limit');

// General API rate limit: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error_code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later',
  },
  standardHeaders: false, // Don't return rate limit info in headers
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/';
  },
});

// Strict limits for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  message: {
    success: false,
    error_code: 'TOO_MANY_LOGIN_ATTEMPTS',
    message: 'Too many login attempts. Try again in 15 minutes.',
  },
  skipSuccessfulRequests: true, // Only count failures
});

// Strict limits for message sending (prevent spam)
const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 messages per minute
  message: {
    success: false,
    error_code: 'MESSAGE_RATE_LIMIT',
    message: 'Sending too many messages. Wait a moment.',
  },
});

module.exports = { apiLimiter, authLimiter, messageLimiter };
```

**Update server.js:**
```javascript
const { apiLimiter, authLimiter, messageLimiter } = require('./middleware/rateLimiter');

app.use(apiLimiter); // Apply to all routes

// Apply stricter limits to sensitive endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/chats/:conversationId/messages', messageLimiter);
```

**Testing:**
```bash
# Send 6 login requests in sequence - 6th should fail with 429
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.ac.ke","password":"wrong"}'
done
# Last one returns 429 Too Many Requests
```

---

#### 1.4 Add Request Logging ⏱️ 2 hours
**Package:** Install `morgan` (HTTP request logger)
```bash
npm install morgan
```

**Update server.js:**
```javascript
const morgan = require('morgan');

// Log HTTP requests
// Format: :method :url :status :response-time ms
app.use(morgan('combined')); // Common format, suitable for production

// Or use custom format:
morgan.token('user', (req) => req.user?.id || 'anonymous');
app.use(morgan(':date[iso] :user :method :url :status :response-time ms'));
```

**Result:**
Every request is now logged to console:
```
2026-04-13T10:30:45.123Z user123 POST /api/listings 201 45 ms
2026-04-13T10:30:50.456Z user456 GET /api/listings?category=Textbooks 200 23 ms
```

**Optional: Log to File**
```bash
npm install rotating-file-stream
```

```javascript
const rfs = require('rotating-file-stream');

const accessLogStream = rfs.createStream('access.log', {
  interval: '1d',        // rotate daily
  path: './logs',
});

app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('combined')); // Still log to console
```

---

#### 1.5 Improve Error Messages ⏱️ 2 hours

**Create:** `backend/utils/errorHandler.js`
```javascript
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { AppError, asyncHandler };
```

**Update Global Error Handler in server.js:**
```javascript
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  return res.status(status).json({
    success: false,
    error_code: err.errorCode || 'INTERNAL_SERVER_ERROR',
    message: isDevelopment ? err.message : 'An error occurred',
    ...(isDevelopment && { stack: err.stack }),
    ...(isDevelopment && { details: err.message }),
  });
});
```

**Usage in Controllers:**
```javascript
const { AppError, asyncHandler } = require('../utils/errorHandler');

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (user.rows.length === 0) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }
  
  const isMatch = await bcrypt.compare(password, user.rows[0].password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }
  
  // ... generate token and return
});
```

---

### Priority 2: Core Feature Implementation (Weeks 2-3)

#### 2.1 Implement Refresh Token Mechanism ⏱️ 4 hours
**Files to Update:**
- `backend/controllers/authController.js`
- `backend/middleware/authMiddleware.js`
- `backend/config/schema.sql` (add token_revocations table)

**Add to Database Schema:**
```sql
-- Create refresh token table for token revocation
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
```

**Update Auth Controller:**
```javascript
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' } // Short-lived
  );
  
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.REFRESH_SECRET,
    { expiresIn: '7d' } // Long-lived
  );
  
  // Store refresh token in DB for revocation
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, refreshToken, new Date(Date.now() + 7*24*60*60*1000)]
  );
  
  return { accessToken, refreshToken };
};

// New endpoint: POST /api/auth/refresh
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new AppError('Refresh token required', 401, 'NO_REFRESH_TOKEN');
  }
  
  // Verify token is valid and in DB
  const tokenRecord = await pool.query(
    'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
    [refreshToken]
  );
  
  if (tokenRecord.rows.length === 0) {
    throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }
  
  // Verify signature
  const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
  
  // Generate new access token
  const newAccessToken = jwt.sign(
    { id: decoded.id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  res.json({
    success: true,
    data: { accessToken: newAccessToken },
  });
});
```

**Update Auth Routes:**
```javascript
router.post('/refresh', refreshAccessToken);

// Logout endpoint - revoke refresh token
router.post('/logout', protect, asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  await pool.query(
    'DELETE FROM refresh_tokens WHERE token = $1 AND user_id = $2',
    [refreshToken, req.user.id]
  );
  
  res.json({ success: true, message: 'Logged out successfully' });
}));
```

---

#### 2.2 Implement Email Verification ⏱️ 4-6 hours
**Files to Update:**
- `backend/config/schema.sql`
- `backend/controllers/authController.js`
- `backend/utils/emailService.js` (create new)

**Add to Database Schema:**
```sql
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN verification_token VARCHAR(500);
ALTER TABLE users ADD COLUMN verification_token_expires TIMESTAMP;
```

**Create Email Service: `backend/utils/emailService.js`**
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendVerificationEmail = async (email, firstName, verificationUrl) => {
  const htmlContent = `
    <h2>Welcome to Campus Mart!</h2>
    <p>Hi ${firstName},</p>
    <p>Thank you for signing up! Please verify your email to activate your account.</p>
    <p>
      <a href="${verificationUrl}" style="background-color: #6769ef; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Verify Email
      </a>
    </p>
    <p>This link expires in 1 hour.</p>
    <hr>
    <p>If you didn't sign up, you can ignore this email.</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Campus Mart Email',
    html: htmlContent,
  });
};

const sendPasswordResetEmail = async (email, firstName, resetUrl) => {
  const htmlContent = `
    <h2>Reset Your Password</h2>
    <p>Hi ${firstName},</p>
    <p>Click the link below to reset your password. This link expires in 1 hour.</p>
    <p>
      <a href="${resetUrl}" style="background-color: #6769ef; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Reset Password
      </a>
    </p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset Your Campus Mart Password',
    html: htmlContent,
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
```

**Install Nodemailer:**
```bash
npm install nodemailer
```

**Update Auth Controller - Register:**
```javascript
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/emailService');

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, faculty, graduation_year } = req.body;

  // Check if user exists
  const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    throw new AppError('Email already registered', 400, 'EMAIL_EXISTS');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Create user
  const result = await pool.query(
    `INSERT INTO users (name, email, password, faculty, graduation_year, verification_token, verification_token_expires)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, email, name`,
    [name, email, hashedPassword, faculty, graduation_year, verificationToken, tokenExpiry]
  );

  const user = result.rows[0];
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  // Send verification email
  try {
    await sendVerificationEmail(user.email, user.name.split(' ')[0], verificationUrl);
  } catch (error) {
    console.error('Email send failed:', error);
    // Still return success - email failure shouldn't block signup
  }

  res.status(201).json({
    success: true,
    message: 'Account created! Check your email to verify.',
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
});

// New endpoint: POST /api/auth/verify-email
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new AppError('Verification token required', 400, 'NO_TOKEN');
  }

  // Find user with valid token
  const result = await pool.query(
    `SELECT * FROM users 
     WHERE verification_token = $1 
     AND verification_token_expires > NOW()`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid or expired token', 400, 'INVALID_TOKEN');
  }

  const user = result.rows[0];

  // Mark email as verified
  await pool.query(
    `UPDATE users 
     SET email_verified_at = NOW(), 
         verification_token = NULL, 
         verification_token_expires = NULL
     WHERE id = $1`,
    [user.id]
  );

  res.json({
    success: true,
    message: 'Email verified successfully!',
    data: { email: user.email },
  });
});
```

**Update Auth Routes:**
```javascript
router.post('/verify-email', verifyEmail);
```

---

#### 2.3 Add Password Reset Flow ⏱️ 2-3 hours

**Update Auth Controller:**
```javascript
// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
  
  // Always return success (don't leak if email exists)
  if (user.rows.length === 0) {
    return res.json({
      success: true,
      message: 'If email exists, reset link sent',
    });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await pool.query(
    `UPDATE users 
     SET verification_token = $1, verification_token_expires = $2
     WHERE id = $3`,
    [resetToken, tokenExpiry, user.rows[0].id]
  );

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  await sendPasswordResetEmail(user.rows[0].email, user.rows[0].name, resetUrl);

  res.json({
    success: true,
    message: 'If email exists, reset link sent',
  });
});

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  const user = await pool.query(
    `SELECT * FROM users 
     WHERE verification_token = $1 
     AND verification_token_expires > NOW()`,
    [token]
  );

  if (user.rows.length === 0) {
    throw new AppError('Invalid or expired reset token', 400, 'INVALID_TOKEN');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await pool.query(
    `UPDATE users 
     SET password = $1, 
         verification_token = NULL, 
         verification_token_expires = NULL
     WHERE id = $2`,
    [hashedPassword, user.rows[0].id]
  );

  res.json({
    success: true,
    message: 'Password reset successfully',
  });
});
```

**Update Auth Routes:**
```javascript
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError('Email required', 400, 'NO_EMAIL');
  }
  await forgotPassword(req, res);
}));

router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    throw new AppError('Token and new password required', 400, 'MISSING_FIELDS');
  }
  await resetPassword(req, res);
}));
```

---

#### 2.4 Add Additional Security Middleware ⏱️ 2 hours
**Install:**
```bash
npm install helmet express-mongo-sanitize
```

**Update server.js:**
```javascript
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

// Set security headers
app.use(helmet());

// Sanitize data against NoSQL injection
app.use(mongoSanitize());

// Limit request body size to prevent large payload DoS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Add security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

---

### Phase 1 Completion Checklist

**Security (CRITICAL):**
- [ ] CORS origin whitelist (30 min)
- [ ] Input validation middleware (4 hours)
- [ ] Rate limiting (2 hours)
- [ ] Request logging (2 hours)
- [ ] Error message improvement (2 hours)
- [ ] Helmet security headers (1 hour)

**Core Features:**
- [ ] Refresh token mechanism (4 hours)
- [ ] Email verification (6 hours)
- [ ] Password reset (3 hours)
- [ ] Transaction handling for orders (3 hours)

**Testing:**
- [ ] Manually test all endpoints with Postman
- [ ] Test validation catches bad inputs
- [ ] Test rate limiting works
- [ ] Test error messages are appropriate

**Estimated Time:** 35-40 hours (4-5 developer days)

---

## 🧪 PHASE 2: API TESTING FRAMEWORK (Weeks 2-3, Parallel with Phase 1)

### Setup Jest Testing Framework

#### 2.1 Install Testing Dependencies
```bash
cd backend
npm install --save-dev jest supertest @babel/preset-env babel-jest dotenv
```

#### 2.2 Configure Jest: `backend/jest.config.js`
```javascript
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**',
  ],
};
```

#### 2.3 Create Tests Directory Structure
```
backend/
├── __tests__/
│   ├── integration/
│   │   ├── auth.test.js
│   │   ├── listings.test.js
│   │   ├── orders.test.js
│   │   └── chats.test.js
│   └── unit/
│       ├── authValidator.test.js
│       └── helpers.test.js
├── jest.config.js
└── package.json
```

#### 2.4 Create Test Helper
**File:** `backend/__tests__/setup.js`
```javascript
const pool = require('../config/db');

beforeAll(async () => {
  // Setup test database
  await pool.query('BEGIN');
});

afterEach(async () => {
  // Rollback after each test
  await pool.query('ROLLBACK');
  await pool.query('BEGIN');
});

afterAll(async () => {
  await pool.query('ROLLBACK');
  await pool.end();
});
```

#### 2.5 Example Integration Tests

**File:** `backend/__tests__/integration/auth.test.js`
```javascript
const request = require('supertest');
const app = require('../../server');
const pool = require('../../config/db');

describe('Authentication API', () => {
  
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@university.ac.ke',
          password: 'SecurePass123!',
          faculty: 'Engineering',
          graduation_year: 2026,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('john@university.ac.ke');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'not-an-email',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error_code).toBe('VALIDATION_ERROR');
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@university.edu',
          password: 'weak', // Too short, no uppercase, no number
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContainEqual(
        expect.objectContaining({ path: 'body.password' })
      );
    });

    it('should reject duplicate email', async () => {
      // Register first time
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@university.ac.ke',
          password: 'SecurePass123!',
        });

      // Register second time with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another John',
          email: 'john@university.ac.ke',
          password: 'SecurePass456!',
        });

      expect(response.status).toBe(400);
      expect(response.body.error_code).toBe('EMAIL_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@university.ac.ke',
          password: 'TestPass123!',
        });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@university.ac.ke',
          password: 'TestPass123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should reject wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@university.ac.ke',
          password: 'WrongPass123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.error_code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@university.ac.ke',
          password: 'SomePass123!',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken;

    beforeEach(async () => {
      // Register and login to get token
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'user@university.ac.ke',
          password: 'TestPass123!',
        });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@university.ac.ke',
          password: 'TestPass123!',
        });

      authToken = loginRes.body.data.accessToken;
    });

    it('should return current user data with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe('user@university.ac.ke');
      expect(response.body.data.password).toBeUndefined(); // Should not leak password
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});
```

**File:** `backend/__tests__/integration/listings.test.js`
```javascript
const request = require('supertest');
const app = require('../../server');

describe('Listings API', () => {
  let authToken;
  let userId;
  let listingId;

  beforeEach(async () => {
    // Setup: Register user and get auth token
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Seller User',
        email: 'seller@university.ac.ke',
        password: 'SellerPass123!',
      });

    userId = registerRes.body.data.id;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'seller@university.ac.ke',
        password: 'SellerPass123!',
      });

    authToken = loginRes.body.data.accessToken;
  });

  describe('POST /api/listings', () => {
    it('should create listing with valid data', async () => {
      const response = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Advanced Algorithms Textbook',
          description: 'Used for 2 semesters, with notes and annotations',
          price: 1500,
          type: 'SALE',
          category: 'Textbooks',
          condition: 'Lightly Used',
          location: 'Library Building, 3rd Floor',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Advanced Algorithms Textbook');
      listingId = response.body.data.id;
    });

    it('should reject listing with missing required fields', async () => {
      const response = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Incomplete Listing',
          // missing: description, price, type, category, etc.
        });

      expect(response.status).toBe(400);
      expect(response.body.error_code).toBe('VALIDATION_ERROR');
    });

    it('should reject negative price', async () => {
      const response = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Item',
          description: 'A test item',
          price: -100, // Invalid
          type: 'SALE',
          category: 'Tech',
          condition: 'New',
          location: 'Campus',
        });

      expect(response.status).toBe(400);
      expect(response.body.details[0].path).toBe('body.price');
    });

    it('should create lease listing with price_unit', async () => {
      const response = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Mountain Bike',
          description: 'High-quality mountain bike for rent',
          price: 500,
          price_unit: 'Per Day',
          type: 'LEASE',
          category: 'Bikes',
          condition: 'Like New',
          location: 'Sports Center',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe('LEASE');
      expect(response.body.data.price_unit).toBe('Per Day');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/listings')
        .send({
          title: 'Test Item',
          description: 'Test',
          price: 100,
          type: 'SALE',
          category: 'Tech',
          condition: 'New',
          location: 'Campus',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/listings', () => {
    beforeEach(async () => {
      // Create sample listings
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/listings')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: `Test Item ${i + 1}`,
            description: 'Test description',
            price: 1000 + (i * 100),
            type: i % 2 === 0 ? 'SALE' : 'LEASE',
            category: i % 2 === 0 ? 'Tech' : 'Textbooks',
            condition: 'New',
            location: 'Campus',
          });
      }
    });

    it('should get all listings', async () => {
      const response = await request(app)
        .get('/api/listings');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter by type', async () => {
      const response = await request(app)
        .get('/api/listings?type=SALE');

      expect(response.status).toBe(200);
      response.body.data.forEach(listing => {
        expect(listing.type).toBe('SALE');
      });
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/listings?category=Tech');

      expect(response.status).toBe(200);
      response.body.data.forEach(listing => {
        expect(listing.category).toBe('Tech');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/listings?page=1&limit=2');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeGreaterThan(0);
    });
  });
});
```

#### 2.6 Run Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test __tests__/integration/auth.test.js

# Run with coverage
npm test -- --coverage

# Watch mode (rerun on file change)
npm test -- --watch
```

#### 2.7 Add Test Scripts to package.json
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest --detectOpenHandles --forceExit",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## 🚀 PHASE 3: FRONTEND INTEGRATION (Weeks 4-6)

### Prerequisite: Backend Running Locally
```bash
cd backend
npm install
node setup-db.js  # Initialize database
npm run dev       # Start server on port 5000
```

### Step 1: Update API Client Configuration

**File:** `mobile/lib/apiClient.ts`

```typescript
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

class APIClient {
  private client: AxiosInstance;
  private tokenPair: TokenPair | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to every request
    this.client.interceptors.request.use(async (config) => {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    // Handle token refresh on 401
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const refreshToken = await AsyncStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken,
              });

              const { accessToken: newAccessToken } = response.data.data;
              await AsyncStorage.setItem('accessToken', newAccessToken);

              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return this.client(originalRequest);
            } catch (refreshError) {
              // Refresh failed, logout user
              await AsyncStorage.clear();
              // Trigger navigation to login
              return Promise.reject(refreshError);
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.tokenPair = { accessToken, refreshToken };
  }

  async getTokens(): Promise<TokenPair | null> {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    return accessToken && refreshToken ? { accessToken, refreshToken } : null;
  }

  async clearTokens() {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    this.tokenPair = null;
  }

  getClient() {
    return this.client;
  }
}

export default new APIClient();
```

### Step 2: Update Auth Service

**File:** `mobile/lib/authService.ts`

```typescript
import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  faculty?: string;
  graduation_year?: number;
}

interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  async register(data: RegisterPayload) {
    try {
      const response = await apiClient.getClient().post('/auth/register', data);
      return {
        success: response.data.success,
        message: response.data.message,
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
        details: error.response?.data?.details,
        errorCode: error.response?.data?.error_code,
      };
    }
  },

  async verifyEmail(token: string) {
    try {
      const response = await apiClient.getClient().post('/auth/verify-email', { token });
      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Verification failed',
        errorCode: error.response?.data?.error_code,
      };
    }
  },

  async login(data: LoginPayload) {
    try {
      const response = await apiClient.getClient().post('/auth/login', data);
      const { accessToken, refreshToken, user } = response.data.data;

      // Store tokens
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      apiClient.setTokens(accessToken, refreshToken);

      return {
        success: true,
        message: 'Login successful',
        data: { user, accessToken },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
        errorCode: error.response?.data?.error_code,
      };
    }
  },

  async refreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const { accessToken } = response.data.data;
      await AsyncStorage.setItem('accessToken', accessToken);
      apiClient.setTokens(accessToken, refreshToken);

      return { success: true, accessToken };
    } catch (error) {
      await authService.logout();
      return { success: false };
    }
  },

  async logout() {
    try {
      await apiClient.getClient().post('/auth/logout', {
        refreshToken: await AsyncStorage.getItem('refreshToken'),
      });
    } catch (error) {
      console.warn('Logout request failed:', error);
    }

    await apiClient.clearTokens();
    await AsyncStorage.removeItem('user');
  },

  async getCurrentUser() {
    try {
      const response = await apiClient.getClient().get('/auth/me');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message,
      };
    }
  },

  async updateProfile(data: any) {
    try {
      const response = await apiClient.getClient().put('/auth/profile', data);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message,
        details: error.response?.data?.details,
      };
    }
  },

  async requestPasswordReset(email: string) {
    try {
      const response = await apiClient.getClient().post('/auth/forgot-password', { email });
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message,
      };
    }
  },

  async resetPassword(token: string, newPassword: string) {
    try {
      const response = await apiClient.getClient().post('/auth/reset-password', {
        token,
        newPassword,
      });
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message,
        details: error.response?.data?.details,
      };
    }
  },
};
```

### Step 3: Update Listing Service

**File:** `mobile/lib/listingService.ts`

```typescript
import apiClient from './apiClient';

interface CreateListingPayload {
  title: string;
  description: string;
  price: number;
  type: 'SALE' | 'LEASE';
  category: string;
  condition: string;
  location: string;
  price_unit?: string;
  image?: FormData;
}

export const listingService = {
  async getListings(filters?: {
    type?: string;
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }

      const response = await apiClient.getClient().get(`/listings?${params.toString()}`);
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch listings',
      };
    }
  },

  async getListingById(id: string) {
    try {
      const response = await apiClient.getClient().get(`/listings/${id}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch listing',
      };
    }
  },

  async createListing(data: CreateListingPayload) {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'image' && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      if (data.image) {
        formData.append('image', data.image);
      }

      const response = await apiClient.getClient().post('/listings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        message: response.data.message,
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create listing',
        details: error.response?.data?.details,
        errorCode: error.response?.data?.error_code,
      };
    }
  },

  async updateListing(id: string, data: Partial<CreateListingPayload>) {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'image' && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      if (data.image) {
        formData.append('image', data.image);
      }

      const response = await apiClient.getClient().put(`/listings/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        message: response.data.message,
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message,
      };
    }
  },

  async deleteListing(id: string) {
    try {
      const response = await apiClient.getClient().delete(`/listings/${id}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message,
      };
    }
  },

  async getUserListings() {
    try {
      const response = await apiClient.getClient().get('/listings/my');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message,
      };
    }
  },

  async getCategories() {
    try {
      const response = await apiClient.getClient().get('/listings/categories');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message,
      };
    }
  },
};
```

### Step 4: Connect Home Screen to Real API

**File:** `mobile/app/(tabs)/index.tsx`

Replace dummy data with real API calls:

```typescript
import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { listingService } from '@/lib/listingService';
import ListingCard from '@/components/ListingCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';

export default function HomeScreen() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    const result = await listingService.getListings({
      limit: 20,
      page: 1,
    });

    if (result.success) {
      setListings(result.data);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const result = await listingService.getListings({
      limit: 20,
      page: 1,
    });

    if (result.success) {
      setListings(result.data);
    }
    setRefreshing(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchListings} />;
  }

  if (listings.length === 0) {
    return <EmptyState message="No listings available" />;
  }

  return (
    <FlatList
      data={listings}
      renderItem={({ item }) => <ListingCard listing={item} />}
      keyExtractor={(item) => item.id.toString()}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={{ padding: 12 }}
    />
  );
}
```

### Step 5: Frontend Integration Checklist

**Authentication:**
- [ ] Update login screen to call authService.login
- [ ] Update register screen to use real API
- [ ] Add email verification screen
- [ ] Add password reset flow
- [ ] Implement token refresh mechanism
- [ ] Add loading indicators to auth screens
- [ ] Add error messages/toasts for auth failures

**Listings:**
- [ ] Update Home screen to fetch real listings
- [ ] Update Browse screen with filters
- [ ] Add product detail screen with real data
- [ ] Implement create listing screen with image upload
- [ ] Add pagination to listing lists
- [ ] Add pull-to-refresh

**Orders/Leases:**
- [ ] Update Leases screen to show real orders
- [ ] Implement order creation flow
- [ ] Add order status tracking
- [ ] Add buyer/seller views

**Chat:**
- [ ] Update Chats screen to fetch conversations
- [ ] Implement message sending
- [ ] Add real-time updates (polling initially, WebSocket later)
- [ ] Add typing indicators
- [ ] Add unread message count

**Favorites:**
- [ ] Implement add/remove favorite
- [ ] Update favorites list view
- [ ] Add favorite badges to listing cards

**Profile:**
- [ ] Update profile screen with real user data
- [ ] Implement profile edit functionality
- [ ] Add logout functionality
- [ ] Add settings/preferences

---

## ⚠️ TESTING CHECKLIST BEFORE GO-LIVE

### Backend Tests
**Unit Tests (30+ test cases):**
- [ ] Auth validators (valid/invalid emails, passwords)
- [ ] Listing validators (valid/invalid data)
- [ ] Error handling middleware
- [ ] JWT token generation/verification

**Integration Tests (40+ test cases):**
- [ ] Auth flow (register → verify → login → logout)
- [ ] Listing CRUD (create, read, update, delete)
- [ ] Order flow (create → status updates)
- [ ] Chat/messaging (create conversation, send messages)
- [ ] Permissions (user can't delete others' listings)
- [ ] Rate limiting (requests blocked after limit)

**Security Tests:**
- [ ] CORS properly configured
- [ ] No password leaks in responses
- [ ] Injection attempts rejected
- [ ] Invalid tokens rejected
- [ ] Rate limiting working

**Manual Testing Checklist:**
- [ ] Test on Android device
- [ ] Test on iOS device
- [ ] Test on web (if applicable)
- [ ] Test with poor network (throttle connection)
- [ ] Test with expired token
- [ ] Test with missing authorization header
- [ ] Test all error paths

### Frontend Tests
**Functionality:**
- [ ] Can register with valid data
- [ ] Receives validation errors for invalid data
- [ ] Can verify email
- [ ] Can login/logout
- [ ] Can refresh page without re-authenticating
- [ ] Listings display real data
- [ ] Can filter listings
- [ ] Can create listing
- [ ] Can send message
- [ ] Can add/remove favorite

**Error Handling:**
- [ ] Network errors show proper message
- [ ] Invalid credentials shows error
- [ ] Form validation errors display
- [ ] API errors don't crash app
- [ ] Recover gracefully from network loss

**Performance:**
- [ ] App starts in < 3 seconds
- [ ] List scroll smooth (60fps)
- [ ] Image loading fast
- [ ] No memory leaks

---

## 📊 Success Metrics

### Phase 1 (Weeks 1-3)
- ✅ All critical security issues fixed
- ✅ Input validation on all endpoints
- ✅ Rate limiting working
- ✅ Email verification implemented
- ✅ Refresh tokens working
- ✅ Error messages cleaned up
- ✅ 20+ integration tests passing

### Phase 2 (Weeks 4-6)
- ✅ All frontend screens connected to API
- ✅ 80+ integration tests passing
- ✅ Manual testing on devices complete
- ✅ Error handling in frontend
- ✅ Loading states visible to users

### Phase 3 (Weeks 7-8)
- ✅ Zero critical vulnerabilities
- ✅ 95%+ test coverage on critical paths
- ✅ API response time < 200ms
- ✅ Zero unhandled crashes
- ✅ Complete documentation

---

## 🔗 Quick Reference Links

**Critical Files:**
- Backend Config: [server.js](./backend/server.js)
- Auth: [authController.js](./backend/controllers/authController.js)
- Database: [schema.sql](./backend/config/schema.sql)
- API Client: [apiClient.ts](./mobile/lib/apiClient.ts)

**Dependencies::**
- Input Validation: `zod` or `joi`
- Rate Limiting: `express-rate-limit`
- Logging: `morgan` + `winston`
- Testing: `jest` + `supertest`
- Security: `helmet`, `express-mongo-sanitize`

---

## 📝 Summary

**Current State:** Backend 75% complete, frontend disconnected, security gaps  
**Blockers:** CORS, input validation, authentication refinements  
**Timeline:** 8-10 weeks to production with focused effort  
**Team:** Best done with 2-3 developers (backend + frontend + QA)

**Next Action:** Start with Phase 1 Security tasks immediately.

---

**Questions?** Refer to the detailed `claude.md` analysis report for more context on each component.
