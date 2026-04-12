const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Validate university email (.ac.ke or .edu)
const isUniversityEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.(ac\.ke|edu)$/.test(email);
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role = 'student', faculty, graduation_year } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required.'
      });
    }

    if (!isUniversityEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Only university emails (.ac.ke or .edu) are allowed.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Check if email already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, faculty, graduation_year)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, avatar_url, is_verified, faculty, graduation_year, rating, created_at`,
      [name, email.toLowerCase(), hashedPassword, role, faculty || null, graduation_year || null]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user,
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user.id);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, avatar_url, is_verified, faculty, graduation_year,
              rating, total_sales, active_listings, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('GetMe error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, faculty, graduation_year } = req.body;
    const avatar_url = req.file ? req.file.path : undefined;

    const fields = [];
    const values = [];
    let idx = 1;

    if (name) { fields.push(`name = $${idx++}`); values.push(name); }
    if (faculty) { fields.push(`faculty = $${idx++}`); values.push(faculty); }
    if (graduation_year) { fields.push(`graduation_year = $${idx++}`); values.push(graduation_year); }
    if (avatar_url) { fields.push(`avatar_url = $${idx++}`); values.push(avatar_url); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    values.push(req.user.id);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
       RETURNING id, name, email, role, avatar_url, is_verified, faculty, graduation_year, rating`,
      values
    );

    res.json({ success: true, message: 'Profile updated.', user: result.rows[0] });
  } catch (err) {
    console.error('UpdateProfile error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Delete account
// @route   DELETE /api/auth/account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ success: true, message: 'Account deleted successfully.' });
  } catch (err) {
    console.error('DeleteAccount error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { register, login, getMe, updateProfile, deleteAccount };
