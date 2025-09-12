const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  generateTokenPair,
  verifyToken,
  extractTokenFromHeader 
} = require('../utils/jwtUtils');

const router = express.Router();

// Generate JWT Token (legacy function for backward compatibility)
const generateToken = (id) => {
  return generateAccessToken(id);
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['patient', 'doctor', 'admin'])
    .withMessage('Role must be patient, doctor, or admin')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (userExists) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    // Create user
    const user = new User({
      username,
      email,
      password, // This will be hashed by the virtual setter
      role
    });

    await user.save();

    // Generate token pair
    const { accessToken, refreshToken } = generateTokenPair(user._id);

    res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .exists()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    console.log(`\n=== LOGIN ATTEMPT ===`);
    console.log(`Email: ${email}`);
    console.log(`Password length: ${password ? password.length : 'undefined'}`);

    // Check for user
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`User not found for email: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log(`User found: ${user.username} (${user.email})`);
    console.log(`User active: ${user.isActive}`);
    console.log(`User role: ${user.role}`);

    // Check if user is active
    if (!user.isActive) {
      console.log(`User account is deactivated`);
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isMatch = user.comparePassword(password);
    console.log(`Password match: ${isMatch}`);

    if (!isMatch) {
      console.log(`Password does not match`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log(`Login successful for ${user.username}`);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token pair
    const { accessToken, refreshToken } = generateTokenPair(user._id);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

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
router.put('/change-password', [
  protect,
  body('currentPassword')
    .exists()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id);

    // Check current password
    const isMatch = user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword; // This will be hashed by the virtual setter
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token using refresh token
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    
    // Check if it's a refresh token
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    // Get user
    const user = await User.findById(decoded.id).select('-passwordHash');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user._id);

    res.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
      user: user.getPublicProfile()
    });
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
    
    res.json({
      valid: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    res.status(401).json({ 
      valid: false, 
      message: 'Invalid token' 
    });
  }
});

module.exports = router;
