const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private (admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    
    // Add search functionality
    if (req.query.search) {
      filter.$or = [
        { username: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filter by role
    if (req.query.role) {
      filter.role = req.query.role;
    }

    // Filter by status
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const users = await User.find(filter)
      .select('-passwordHash')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users
// @desc    Create a new user (admin only)
// @access  Private (admin only)
router.post('/', [
  protect,
  authorize('admin'),
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
    .withMessage('Role must be patient, doctor, or admin'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role, isActive = true } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Create new user
    const user = new User({
      username,
      email,
      password, // This will be hashed by the virtual setter
      role,
      isActive
    });

    await user.save();

    // Return user without password
    const userResponse = user.getPublicProfile();
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (admin only)
// @access  Private (admin only)
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (admin only)
// @access  Private (admin only)
router.put('/:id', [
  protect,
  authorize('admin'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['patient', 'doctor', 'admin'])
    .withMessage('Role must be patient, doctor, or admin'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if username or email already exists (if being updated)
    if (req.body.username && req.body.username !== user.username) {
      const existingUsername = await User.findOne({ username: req.body.username });
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already exists' });
      }
    }

    if (req.body.email && req.body.email !== user.email) {
      const existingEmail = await User.findOne({ email: req.body.email });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Prepare update data
    const updateData = { ...req.body };
    
    // If password is provided, it will be automatically hashed by the virtual setter
    // The virtual setter will handle the password hashing when we save the user
    
    // Update user fields individually to ensure proper handling
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        user[key] = updateData[key];
      }
    });

    // Save the user (this will trigger password hashing if password was provided)
    await user.save();

    // Return user without password hash
    const userResponse = user.getPublicProfile();
    res.json(userResponse);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Hard delete user (admin only) - permanently removes user from database
// @access  Private (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('Delete user request:', {
      userId: req.params.id,
      adminId: req.user._id,
      adminRole: req.user.role
    });

    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid ObjectId format:', req.params.id);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      console.log('User not found:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      console.log('Admin trying to delete own account');
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Check if user has associated data that would be affected
    const Patient = require('../models/Patient');
    const Doctor = require('../models/Doctor');
    const Appointment = require('../models/Appointment');
    const MedicalRecord = require('../models/MedicalRecord');

    // Check for associated records
    const patientRecord = await Patient.findOne({ user: user._id });
    const doctorRecord = await Doctor.findOne({ user: user._id });
    
    console.log('Associated records found:', {
      patientRecord: patientRecord ? patientRecord._id : null,
      doctorRecord: doctorRecord ? doctorRecord._id : null
    });

    const appointments = await Appointment.find({ 
      $or: [
        { patient: patientRecord?._id },
        { doctor: doctorRecord?._id }
      ]
    });
    const medicalRecords = await MedicalRecord.find({ 
      $or: [
        { patient: patientRecord?._id },
        { doctor: doctorRecord?._id }
      ]
    });

    console.log('Data check results:', {
      appointmentsCount: appointments.length,
      medicalRecordsCount: medicalRecords.length
    });

    // If user has associated data, prevent hard delete
    if (appointments.length > 0 || medicalRecords.length > 0) {
      console.log('User has associated data, preventing deletion');
      return res.status(400).json({ 
        message: 'Cannot delete user with associated appointments or medical records. Please deactivate instead.',
        hasAssociatedData: true,
        appointmentsCount: appointments.length,
        medicalRecordsCount: medicalRecords.length
      });
    }

    // Hard delete the user
    await User.findByIdAndDelete(req.params.id);

    // Also delete associated patient/doctor records if they exist
    if (patientRecord) {
      await Patient.findByIdAndDelete(patientRecord._id);
    }
    if (doctorRecord) {
      await Doctor.findByIdAndDelete(doctorRecord._id);
    }

    res.json({ message: 'User permanently deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id/deactivate
// @desc    Deactivate user (admin only) - soft delete, user can be reactivated
// @access  Private (admin only)
router.put('/:id/deactivate', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('Deactivate user request:', {
      userId: req.params.id,
      adminId: req.user._id,
      adminRole: req.user.role
    });

    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid ObjectId format:', req.params.id);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    // Soft delete - set isActive to false
    user.isActive = false;
    await user.save();

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id/password
// @desc    Update user password (admin only)
// @access  Private (admin only)
router.put('/:id/password', [
  protect,
  authorize('admin'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password (will be automatically hashed by the virtual setter)
    user.password = req.body.password;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id/activate
// @desc    Activate user (admin only)
// @access  Private (admin only)
router.put('/:id/activate', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = true;
    await user.save();

    res.json({ message: 'User activated successfully' });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/stats/overview
// @desc    Get user statistics (admin only)
// @access  Private (admin only)
router.get('/stats/overview', protect, authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentUsers = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .limit(5);

    const stats = {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      byRole: usersByRole,
      recent: recentUsers
    };

    res.json(stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
