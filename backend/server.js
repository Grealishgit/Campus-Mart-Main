const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const pool = require('./config/db');

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: '*', // Tighten this in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
  const isCloudinaryPermissionError = err?.name === 'UnexpectedResponse'
    && err?.http_code === 403
    && /unexpected status code/i.test(err?.message || '');

  if (isCloudinaryPermissionError) {
    console.error('Unhandled error: Cloudinary key is missing upload create permission.');
    return res.status(500).json({
      success: false,
      message: 'Cloudinary upload failed: API key is missing create/upload permission.',
    });
  }

  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

// ── Start server ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Forces an initial DB connection so status is shown at startup.
    await pool.query('SELECT 1');

    app.listen(PORT, () => {
      console.log(`Campus Mart API running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('Failed to connect to PostgreSQL on startup:', err.message);
    process.exit(1);
  }
};

startServer();
