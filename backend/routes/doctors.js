const express = require('express');
const { body, validationResult } = require('express-validator');
const Doctor = require('../models/Doctor');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/doctors
// @desc    Get all doctors
// @access  Private (Admin, Doctor, Patient)
router.get('/', protect, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    // Search functionality
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { specialization: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filter by specialization
    if (req.query.specialization) {
      query.specialization = req.query.specialization;
    }

    // Filter by experience
    if (req.query.minExperience) {
      query.experience = { $gte: parseInt(req.query.minExperience) };
    }

    // Get total count
    const total = await Doctor.countDocuments(query);
    
    // Get paginated doctors
    const doctors = await Doctor.find(query)
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      doctors,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/doctors/specializations
// @desc    Get all specializations
// @access  Private
router.get('/specializations', protect, async (req, res) => {
  try {
    const specializations = await Doctor.distinct('specialization');
    res.json(specializations);
  } catch (error) {
    console.error('Get specializations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/doctors/:id
// @desc    Get doctor by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('user', 'username email');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    res.json(doctor);
  } catch (error) {
    console.error('Get doctor error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/doctors
// @desc    Create a new doctor
// @access  Private (Admin only)
router.post('/', [
  protect,
  authorize('admin'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('contact').notEmpty().withMessage('Contact number is required'),
    body('specialization').notEmpty().withMessage('Specialization is required'),
    body('licenseNumber').notEmpty().withMessage('License number is required'),
    body('experience').isInt({ min: 0 }).withMessage('Experience must be a positive number'),
    body('education').notEmpty().withMessage('Education is required'),
    body('consultationFee').isFloat({ min: 0 }).withMessage('Consultation fee must be a positive number'),
    body('address').notEmpty().withMessage('Address is required').isString().withMessage('Address must be a string').isLength({ max: 500 }).withMessage('Address cannot exceed 500 characters')
  ]
], async (req, res) => {
  try {
    console.log('Creating doctor with data:', req.body);
    console.log('User making request:', req.user);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const newDoctor = new Doctor(req.body);
    await newDoctor.save();
    
    await newDoctor.populate('user', 'username email');
    console.log('Doctor created successfully:', newDoctor);
    res.status(201).json(newDoctor);
  } catch (error) {
    console.error('Create doctor error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Doctor with this email already exists' });
    }
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/doctors/:id
// @desc    Update doctor
// @access  Private (Admin only)
router.put('/:id', [
  protect,
  authorize('admin'),
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('contact').optional().notEmpty().withMessage('Contact number cannot be empty'),
    body('specialization').optional().notEmpty().withMessage('Specialization cannot be empty'),
    body('experience').optional().isInt({ min: 0 }).withMessage('Experience must be a positive number'),
    body('consultationFee').optional().isFloat({ min: 0 }).withMessage('Consultation fee must be a positive number'),
    body('address').optional().isString().withMessage('Address must be a string').isLength({ max: 500 }).withMessage('Address cannot exceed 500 characters'),
    body('username').optional().isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ]
], async (req, res) => {
  try {
    console.log('Updating doctor:', req.params.id, 'with data:', req.body);
    console.log('User making request:', req.user);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      console.log('Doctor not found:', req.params.id);
      return res.status(404).json({ message: 'Doctor not found' });
    }

    console.log('Found doctor:', doctor);

    // Store original email for user sync
    const originalEmail = doctor.email;

    // Update fields with proper validation
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        // Ensure address field is properly handled as a string
        if (key === 'address' && typeof req.body[key] === 'string') {
          doctor[key] = req.body[key].trim();
        } else {
          doctor[key] = req.body[key];
        }
      }
    });

    console.log('Updated doctor data:', doctor);
    await doctor.save();
    
    // Sync changes with linked User record if doctor has a user reference
    if (doctor.user) {
      try {
        const { syncUserData } = require('../utils/syncUserData');
        await syncUserData('doctor', doctor._id, req.body, originalEmail);
      } catch (userUpdateError) {
        console.error('Error updating linked user record:', userUpdateError);
        // Don't fail the doctor update if user update fails, but log the error
      }
    }
    await doctor.populate('user', 'username email');
    
    console.log('Doctor updated successfully:', doctor);
    res.json(doctor);
  } catch (error) {
    console.error('Update doctor error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Doctor with this email already exists' });
    }
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/doctors/:id
// @desc    Delete doctor
// @access  Private (Admin only)
router.delete('/:id', [protect, authorize('admin')], async (req, res) => {
  try {
    console.log('Deleting doctor:', req.params.id);
    console.log('User making request:', req.user);
    
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      console.log('Doctor not found:', req.params.id);
      return res.status(404).json({ message: 'Doctor not found' });
    }

    console.log('Found doctor to delete:', doctor);
    await doctor.deleteOne();
    console.log('Doctor deleted successfully');
    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Delete doctor error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/doctors/:id/appointments
// @desc    Get doctor's appointments
// @access  Private (Admin, Doctor)
router.get('/:id/appointments', protect, async (req, res) => {
  try {
    const Appointment = require('../models/Appointment');
    const appointments = await Appointment.find({ doctor: req.params.id })
      .populate('patient', 'name contact')
      .sort({ dateTime: -1 });
    
    res.json(appointments);
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

