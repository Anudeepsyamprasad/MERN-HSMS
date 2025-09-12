const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes
const protect = async (req, res, next) => {

  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Check if token exists
      if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-passwordHash');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!req.user.isActive) {
        return res.status(401).json({ message: 'User account is deactivated' });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      
      // Handle specific JWT errors
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Not authorized, invalid token' });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Not authorized, token expired' });
      }
      
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware to authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('Authorization check:', {
      userRole: req.user?.role,
      requiredRoles: roles,
      userId: req.user?._id
    });

    if (!req.user) {
      console.log('No user found in request');
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      console.log('User role not authorized:', req.user.role, 'Required:', roles);
      return res.status(403).json({ 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }

    console.log('Authorization successful');
    next();
  };
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  return authorize('admin')(req, res, next);
};

// Middleware to check if user is doctor
const isDoctor = (req, res, next) => {
  return authorize('doctor', 'admin')(req, res, next);
};

// Middleware to check if user is patient
const isPatient = (req, res, next) => {
  return authorize('patient', 'doctor', 'admin')(req, res, next);
};

// Middleware to check if user owns the resource or is admin
const isOwnerOrAdmin = (resourceUserId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    if (req.user._id.toString() === resourceUserId.toString()) {
      return next();
    }

    return res.status(403).json({ message: 'Not authorized to access this resource' });
  };
};

module.exports = {
  protect,
  authorize,
  isAdmin,
  isDoctor,
  isPatient,
  isOwnerOrAdmin
};
