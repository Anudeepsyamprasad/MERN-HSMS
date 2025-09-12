const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate access token
const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Verify token and return decoded payload
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Decode token without verification (for getting payload)
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error('Invalid token format');
  }
};

// Check if token is expired
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

// Get token expiration time
const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return null;
    
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

// Generate token pair (access + refresh)
const generateTokenPair = (userId) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);
  
  return {
    accessToken,
    refreshToken,
    expiresIn: process.env.JWT_EXPIRE || '30d'
  };
};

// Extract token from Authorization header
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

// Validate token and get user
const validateTokenAndGetUser = async (token) => {
  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-passwordHash');
    
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }
    
    return user;
  } catch (error) {
    throw new Error('Token validation failed');
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  decodeToken,
  isTokenExpired,
  getTokenExpiration,
  extractTokenFromHeader,
  validateTokenAndGetUser
};
