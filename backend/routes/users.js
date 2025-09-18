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

    if (req.query.search) {
      filter.$or = [
        { username: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    if (req.query.role) {
      filter.role = req.query.role;
    }

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
      pagination: { current: page, pages: Math.ceil(total / limit), total },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users
// @desc    Create a new user (admin only)
// @access  Private (admin only)
router.post(
  '/',
  [
    protect,
    authorize('admin'),
    body('username')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').isIn(['patient', 'doctor', 'admin']).withMessage('Role must be patient, doctor, or admin'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password, role, isActive = true } = req.body;

      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        if (existingUser.username === username) {
          return res.status(400).json({ message: 'Username already exists' });
        }
        if (existingUser.email === email) {
          return res.status(400).json({ message: 'Email already exists' });
        }
      }

      const user = new User({ username, email, password, role, isActive });
      await user.save();

      const userResponse = user.getPublicProfile();
      res.status(201).json(userResponse);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

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
router.put(
  '/:id',
  [
    protect,
    authorize('admin'),
    body('username')
      .optional()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email').optional().isEmail().withMessage('Please enter a valid email'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').optional().isIn(['patient', 'doctor', 'admin']).withMessage('Role must be patient, doctor, or admin'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

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

      const updateData = { ...req.body };
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) {
          user[key] = updateData[key];
        }
      });

      await user.save();
      const userResponse = user.getPublicProfile();
      res.json(userResponse);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/users/:id
// @desc    Hard delete user (admin only) - permanently removes user from database
// @access  Private (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const Patient = require('../models/Patient');
    const Doctor = require('../models/Doctor');
    const Appointment = require('../models/Appointment');
    const MedicalRecord = require('../models/MedicalRecord');

    const patientRecord = await Patient.findOne({ user: user._id });
    const doctorRecord = await Doctor.findOne({ user: user._id });

    const appointments = await Appointment.find({
      $or: [{ patient: patientRecord?._id }, { doctor: doctorRecord?._id }],
    });
    const medicalRecords = await MedicalRecord.find({
      $or: [{ patient: patientRecord?._id }, { doctor: doctorRecord?._id }],
    });

    if (appointments.length > 0 || medicalRecords.length > 0) {
      return res.status(400).json({
        message:
          'Cannot delete user with associated appointments or medical records. Please deactivate instead.',
        hasAssociatedData: true,
        appointmentsCount: appointments.length,
        medicalRecordsCount: medicalRecords.length,
      });
    }

    await User.findByIdAndDelete(req.params.id);
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
// @desc    Deactivate user (admin only)
// @access  Private (admin only)
router.put('/:id/deactivate', protect, authorize('admin'), async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

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
router.put(
  '/:id/password',
  [protect, authorize('admin'), body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.password = req.body.password;
      await user.save();
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Update password error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

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
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const recentUsers = await User.find().select('-passwordHash').sort({ createdAt: -1 }).limit(5);

    const stats = { total: totalUsers, active: activeUsers, inactive: inactiveUsers, byRole: usersByRole, recent: recentUsers };
    res.json(stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


