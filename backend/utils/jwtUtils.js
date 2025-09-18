const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId, type: 'refresh' }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error('Invalid token format');
  }
};

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

const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return null;
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

const generateTokenPair = (userId) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);
  return { accessToken, refreshToken, expiresIn: process.env.JWT_EXPIRE || '30d' };
};

const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

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
  validateTokenAndGetUser,
};


