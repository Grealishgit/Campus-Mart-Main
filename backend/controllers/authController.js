const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppError, asyncHandler } = require('../utils/errorHandler');

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
const registerUser = asyncHandler(async (req, res) => {
  try {
    const { name, email, password, role = 'student', faculty, graduation_year, year } = req.body;
    const normalizedGraduationYear = graduation_year ?? year ?? null;
    // Check if email already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      throw new AppError('An account with this email already exists.', 409, 'EMAIL_EXISTS');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, faculty, graduation_year)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email, role, avatar_url, is_verified, faculty, graduation_year, rating, created_at`,
      [name, email.toLowerCase(), hashedPassword, role, faculty || null, normalizedGraduationYear]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user,
    });
  } catch (error) {
    console.error('Registration Failed! Please try Again:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error_code: error.errorCode || 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An error occurred during registration.',
    });

  }



});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  if (result.rows.length === 0) {
   return res.status(401).json({
      success: false,
      error_code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password.',
    });
  }

  const user = result.rows[0];

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
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
});

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, email, role, avatar_url, is_verified, faculty, graduation_year,
            rating, total_sales, active_listings, created_at, updated_at
     FROM users WHERE id = $1`,
    [req.user.id]
  );

  if (!result.rows[0]) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  res.json({ success: true, user: result.rows[0] });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
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
    throw new AppError('No fields to update.', 400, 'NO_FIELDS_TO_UPDATE');
  }

  values.push(req.user.id);
  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
     RETURNING id, name, email, role, avatar_url, is_verified, faculty, graduation_year, rating, total_sales, active_listings, created_at, updated_at`,
    values
  );

  res.json({ success: true, message: 'Profile updated.', user: result.rows[0] });
});

// @desc    Delete account
// @route   DELETE /api/auth/account
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
  res.json({ success: true, message: 'Account deleted successfully.' });
});

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, verificationCode } = req.body;

  // For now, just mark email as verified
  // In production, you'd validate the code against a verification token
  const result = await pool.query(
    'UPDATE users SET is_verified = true WHERE email = $1 RETURNING id, email, is_verified',
    [email]
  );

  if (!result.rows[0]) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  res.json({
    success: true,
    message: 'Email verified successfully.',
    user: result.rows[0],
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required.', 400, 'TOKEN_REQUIRED');
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError('Invalid or expired refresh token.', 401, 'INVALID_TOKEN');
  }

  // Generate new access token
  const accessToken = generateToken(decoded.id);

  res.json({
    success: true,
    message: 'Token refreshed successfully.',
    accessToken,
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (!result.rows[0]) {
    throw new AppError('No account found with this email.', 404, 'EMAIL_NOT_FOUND');
  }

  // In production, generate and send reset token via email
  res.json({
    success: true,
    message: 'Password reset email sent. Check your inbox.',
  });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword, resetToken } = req.body;

  const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (!result.rows[0]) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await pool.query(
    'UPDATE users SET password = $1 WHERE email = $2',
    [hashedPassword, email]
  );

  res.json({
    success: true,
    message: 'Password reset successfully.',
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  // Token invalidation would typically happen on the client side with AsyncStorage
  // In production, you'd blacklist the token or use refresh token rotation
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

module.exports = {
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
};
