const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
require('dotenv').config();
const pool = require('./config/db');
const { apiLimiter, authLimiter, registerLimiter, messageLimiter, listingLimiter } = require('./middleware/rateLimiter');

const app = express();
app.set('etag', false);

// ── Security Middleware ─────────────────────────────────────
// Set security HTTP headers
// CORS Configuration - Whitelist specific origins
app.use(cors({
  origin: [
    'http://localhost:5000',
    'http://localhost:8081',
    'http://localhost:5173',
    'https://campus-mart.hantardev.tech',
    'https://campus-mart-main.vercel.app',
    'http://192.168.0.105:8081',
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // add OPTIONS
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
}));


app.use(helmet());

// Sanitize data against NoSQL injection
app.use(mongoSanitize());


// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Request Logging ─────────────────────────────────────────
// Log HTTP requests
app.use(morgan(':date[iso] :remote-addr :method :url :status :response-time ms'));

// ── Rate Limiting ───────────────────────────────────────────
// Apply general rate limiter to all routes
// app.use(apiLimiter);

// ── Custom Security Headers ────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});

// ── Routes ──────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const favoriteRoutes = require('./routes/favouriteRoutes');
const orderRoutes = require('./routes/orderRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/admin', adminRoutes);

// ── Debug: List all registered API routes ───────────────────
if (process.env.NODE_ENV !== 'production') {
  const listEndpoints = require('express-list-endpoints');

  console.log('\nRegistered API Routes:\n');
  console.table(listEndpoints(app));
}

// ── Health check ────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Campus Mart API is running!', timestamp: new Date() });
});

// ── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global error handler ────────────────────────────────────
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Cloudinary specific error handling
  const isCloudinaryPermissionError = err?.name === 'UnexpectedResponse'
    && err?.http_code === 403
    && /unexpected status code/i.test(err?.message || '');

  if (isCloudinaryPermissionError) {
    console.error('Cloudinary Error: API key missing upload create permission');
    return res.status(500).json({
      success: false,
      error_code: 'CLOUDINARY_ERROR',
      message: 'Image upload service temporarily unavailable',
    });
  }

  // Log error for debugging
  if (isDevelopment) {
    console.error(`[${status}] ${err.errorCode || 'ERROR'}:`, err.message);
  }

  // Send error response
  return res.status(status).json({
    success: false,
    error_code: err.errorCode || 'INTERNAL_SERVER_ERROR',
    message: isDevelopment ? err.message : 'An error occurred',
    ...(isDevelopment && { stack: err.stack }),
  });
});

const PORT = process.env.PORT;

const env = process.env.NODE_ENV;
// console.log(env)


  const startServer = async () => {
  try {
    // Forces an initial DB connection so status is shown at startup.
    await pool.query('SELECT 1');

    app.listen(PORT, '0.0.0.0', () => {
      console.log('Server Running!');
      // console.log(`Server running on http://192.168.0.105:${PORT}`);
      // console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      // console.log(`Server accessible from other devices on the network`);
    });
  } catch (err) {
    console.error('Failed to connect to PostgreSQL on startup:', err.message);
    process.exit(1);
  }
  };


  startServer();




