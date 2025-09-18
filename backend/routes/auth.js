const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  extractTokenFromHeader,
  validateTokenAndGetUser,
} = require('../utils/jwtUtils');

const router = express.Router();

// Generate JWT Token (legacy function for backward compatibility)
const generateToken = (id) => {
  return generateAccessToken(id);
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('username')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').isIn(['patient', 'doctor', 'admin']).withMessage('Role must be patient, doctor, or admin'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password, role } = req.body;

      const userExists = await User.findOne({ $or: [{ email }, { username }] });
      if (userExists) {
        return res.status(400).json({ message: 'User with this email or username already exists' });
      }

      const user = new User({ username, email, password, role });
      await user.save();

      const { accessToken, refreshToken } = generateTokenPair(user._id);
      res.status(201).json({ success: true, accessToken, refreshToken, user: user.getPublicProfile() });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Check database connection state and ensure it's ready
      if (mongoose.connection.readyState !== 1) {
        if (mongoose.connection.readyState === 0) {
          try {
            await mongoose.connect(process.env.MONGODB_URI, {
              serverSelectionTimeoutMS: 5000,
              socketTimeoutMS: 45000,
              maxPoolSize: 10,
              minPoolSize: 2,
              family: 4,
              bufferCommands: false,
              retryWrites: true,
              retryReads: true,
              connectTimeoutMS: 5000,
              heartbeatFrequencyMS: 10000,
              maxIdleTimeMS: 0,
            });
            await new Promise((resolve) => setTimeout(resolve, 100));
            if (mongoose.connection.readyState !== 1) {
              return res.status(503).json({ message: 'Database connection failed' });
            }
          } catch (error) {
            return res.status(503).json({ message: 'Database connection failed' });
          }
        } else {
          return res.status(503).json({ message: 'Database not ready' });
        }
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }

      const isMatch = user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      user.lastLogin = new Date();
      await user.save();

      const { accessToken, refreshToken } = generateTokenPair(user._id);
      res.json({ success: true, accessToken, refreshToken, user: user.getPublicProfile() });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login', error: error.message });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', protect, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put(
  '/change-password',
  [
    protect,
    body('currentPassword').exists().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id);
      const isMatch = user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      user.password = newPassword;
      await user.save();
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST /api/auth/refresh
// @desc    Refresh access token using refresh token
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    const decoded = verifyToken(refreshToken);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid token type' });
    }
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user._id);
    res.json({ success: true, accessToken, refreshToken: newRefreshToken, user: user.getPublicProfile() });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// @route   POST /api/auth/validate
// @desc    Validate access token
// @access  Public
router.post('/validate', async (req, res) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const user = await validateTokenAndGetUser(token);
    res.json({ valid: true, user: user.getPublicProfile() });
  } catch (error) {
    res.status(401).json({ valid: false, message: 'Invalid token' });
  }
});

module.exports = router;


