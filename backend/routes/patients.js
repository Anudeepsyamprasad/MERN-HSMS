const express = require('express');
const { body, validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/patients
// @desc    Get all patients (filtered by role)
// @access  Private (Admin, Doctor)
router.get('/', protect, authorize('admin', 'doctor'), async (req, res) => {
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
        { email: { $regex: req.query.search, $options: 'i' } },
        { contact: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filter by gender
    if (req.query.gender) {
      query.gender = req.query.gender;
    }

    // Filter by blood group
    if (req.query.bloodGroup) {
      query.bloodGroup = req.query.bloodGroup;
    }

    // Get total count
    const total = await Patient.countDocuments(query);
    
    // Get paginated patients
    const patients = await Patient.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Convert to JSON to include virtual fields
    const patientsWithAge = patients.map(patient => patient.toJSON());

    res.json({
      patients: patientsWithAge,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patients/:id
// @desc    Get patient by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Convert to JSON to include virtual fields
    const patientData = patient.toJSON();
    res.json(patientData);
  } catch (error) {
    console.error('Get patient error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/patients
// @desc    Create a new patient
// @access  Private (Admin, Doctor)
router.post('/', [
  protect,
  authorize('admin', 'doctor'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('contact').notEmpty().withMessage('Contact number is required'),
    body('dateOfBirth').notEmpty().withMessage('Date of birth is required'),
    body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Valid gender is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('bloodGroup').notEmpty().withMessage('Blood group is required')
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    console.log('Creating patient with data:', req.body);
    console.log('Date of birth received:', req.body.dateOfBirth);
    
    const newPatient = new Patient(req.body);
    await newPatient.save();
    
    // Convert to JSON to include virtual fields
    const patientData = newPatient.toJSON();
    console.log('Patient created with age:', patientData.age);
    
    res.status(201).json(patientData);
  } catch (error) {
    console.error('Create patient error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Patient with this email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/patients/:id
// @desc    Update patient
// @access  Private (Admin, Doctor)
router.put('/:id', [
  protect,
  authorize('admin', 'doctor'),
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('contact').optional().notEmpty().withMessage('Contact number cannot be empty'),
    body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Valid gender is required'),
    body('bloodGroup').optional().notEmpty().withMessage('Blood group cannot be empty'),
    body('username').optional().isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Store original email for user sync
    const originalEmail = patient.email;
    
    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        patient[key] = req.body[key];
      }
    });

    console.log('Updating patient with data:', req.body);
    console.log('Date of birth received:', req.body.dateOfBirth);
    console.log('Password field received:', req.body.password ? 'YES (length: ' + req.body.password.length + ')' : 'NO');
    console.log('Username field received:', req.body.username ? 'YES (' + req.body.username + ')' : 'NO');

    await patient.save();
    
    // Sync changes with linked User record if patient has a user reference
    if (patient.user) {
      try {
        const { syncUserData } = require('../utils/syncUserData');
        await syncUserData('patient', patient._id, req.body, originalEmail);
      } catch (userUpdateError) {
        console.error('Error updating linked user record:', userUpdateError);
        // Don't fail the patient update if user update fails, but log the error
      }
    }
    
    // Convert to JSON to include virtual fields
    const patientData = patient.toJSON();
    console.log('Patient updated with age:', patientData.age);
    
    res.json(patientData);
  } catch (error) {
    console.error('Update patient error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Patient not found' });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Patient with this email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/patients/:id/test-login
// @desc    Test patient login credentials
// @access  Private (Admin only)
router.post('/:id/test-login', [protect, authorize('admin')], async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const patient = await Patient.findById(req.params.id).populate('user');
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    if (!patient.user) {
      return res.status(400).json({ message: 'Patient not linked to user account' });
    }
    
    const user = patient.user;
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Account is deactivated',
        details: 'User account is not active'
      });
    }
    
    // Check password
    const isMatch = user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Invalid credentials',
        details: 'Password does not match'
      });
    }
    
    res.json({
      success: true,
      message: 'Login credentials are valid',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
    
  } catch (error) {
    console.error('Test login error:', error);
    res.status(500).json({ message: 'Server error during test login' });
  }
});

// @route   DELETE /api/patients/:id
// @desc    Delete patient
// @access  Private (Admin only)
router.delete('/:id', [protect, authorize('admin')], async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    await patient.deleteOne();
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Delete patient error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patients/:id/medical-records
// @desc    Get patient's medical records
// @access  Private (Admin, Doctor, Patient)
router.get('/:id/medical-records', protect, async (req, res) => {
  try {
    // In a real app, you'd check if the user has permission to view this patient's records
    const MedicalRecord = require('../models/MedicalRecord');
    const medicalRecords = await MedicalRecord.find({ patient: req.params.id })
      .populate('doctor', 'name specialization')
      .sort({ visitDate: -1 });
    
    res.json(medicalRecords);
  } catch (error) {
    console.error('Get patient medical records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patients/:id/appointments
// @desc    Get patient's appointments
// @access  Private (Admin, Doctor, Patient)
router.get('/:id/appointments', protect, async (req, res) => {
  try {
    // In a real app, you'd check if the user has permission to view this patient's appointments
    const Appointment = require('../models/Appointment');
    const appointments = await Appointment.find({ patient: req.params.id })
      .populate('doctor', 'name specialization')
      .sort({ appointmentDate: -1 });
    
    res.json(appointments);
  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

