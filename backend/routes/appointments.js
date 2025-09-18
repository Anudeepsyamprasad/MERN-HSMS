const express = require('express');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/appointments
// @desc    Get all appointments (filtered by role)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    // Filter by role and user permissions
    if (req.user.role === 'patient') {
      // Patients can only see their own appointments
      const Patient = require('../models/Patient');
      let patient = await Patient.findOne({ user: req.user._id });
      
      if (!patient) {
        // Fallback: try to find by email (backward compatibility)
        patient = await Patient.findOne({ email: req.user.email });
      }
      
      if (patient) {
        query.patient = patient._id;
      } else {
        // If no patient record found, return empty results
        return res.json({
          appointments: [],
          pagination: {
            current: page,
            pages: 0,
            total: 0
          }
        });
      }
    } else if (req.user.role === 'doctor') {
      // Doctors can see appointments where they are the assigned doctor
      const Doctor = require('../models/Doctor');
      let doctor = await Doctor.findOne({ user: req.user._id });
      
      if (!doctor) {
        // Fallback: try to find by email (backward compatibility)
        doctor = await Doctor.findOne({ email: req.user.email });
      }
      
      if (doctor) {
        query.doctor = doctor._id;
      }
    }
    // Admin can see all appointments (no additional filtering)
    
    // Search functionality
    if (req.query.search) {
      query.$or = [
        { reason: { $regex: req.query.search, $options: 'i' } },
        { notes: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.dateTime = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Filter by doctor
    if (req.query.doctorId) {
      query.doctor = req.query.doctorId;
    }

    // Filter by patient
    if (req.query.patientId) {
      query.patient = req.query.patientId;
    }

    // Get total count
    const total = await Appointment.countDocuments(query);
    
    // Get paginated appointments
    const appointments = await Appointment.find(query)
      .populate('patient', 'name contact')
      .populate('doctor', 'name specialization')
      .sort({ dateTime: -1 })
      .skip(skip)
      .limit(limit);


    res.json({
      appointments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/appointments/stats
// @desc    Get appointment statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const Patient = require('../models/Patient');
    const Doctor = require('../models/Doctor');
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    let stats = {};

    // Role-based statistics
    if (req.user.role === 'admin') {
      // Admin sees all statistics
      stats = {
        totalPatients: await Patient.countDocuments(),
        totalDoctors: await Doctor.countDocuments(),
        totalAppointments: await Appointment.countDocuments(),
        todayAppointments: await Appointment.countDocuments({
          dateTime: { $gte: startOfDay, $lt: endOfDay },
          status: { $ne: 'cancelled' }
        }),
        upcomingAppointments: await Appointment.countDocuments({
          dateTime: { $gte: new Date() },
          status: { $nin: ['cancelled', 'completed'] }
        }),
        completedAppointments: await Appointment.countDocuments({
          dateTime: { $gte: startOfDay, $lt: endOfDay },
          status: 'completed'
        })
      };
    } else if (req.user.role === 'doctor') {
      // Doctor sees statistics for their assigned appointments
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor) {
        // Fallback: try to find by email (backward compatibility)
        const doctorByEmail = await Doctor.findOne({ email: req.user.email });
        if (doctorByEmail) {
          doctor = doctorByEmail;
        }
      }

      if (doctor) {
        const doctorAppointments = { doctor: doctor._id };
        stats = {
          totalPatients: await Patient.countDocuments(), // Doctors can see all patients
          totalDoctors: 1, // Only themselves
          totalAppointments: await Appointment.countDocuments(doctorAppointments),
          todayAppointments: await Appointment.countDocuments({
            ...doctorAppointments,
            dateTime: { $gte: startOfDay, $lt: endOfDay },
            status: { $ne: 'cancelled' }
          }),
          upcomingAppointments: await Appointment.countDocuments({
            ...doctorAppointments,
            dateTime: { $gte: new Date() },
            status: { $nin: ['cancelled', 'completed'] }
          }),
          completedAppointments: await Appointment.countDocuments({
            ...doctorAppointments,
            dateTime: { $gte: startOfDay, $lt: endOfDay },
            status: 'completed'
          })
        };
      } else {
        // No doctor record found
        stats = {
          totalPatients: 0,
          totalDoctors: 0,
          totalAppointments: 0,
          todayAppointments: 0,
          upcomingAppointments: 0,
          completedAppointments: 0
        };
      }
    } else if (req.user.role === 'patient') {
      // Patient sees only their own statistics
      let patient = await Patient.findOne({ user: req.user._id });
      if (!patient) {
        // Fallback: try to find by email (backward compatibility)
        const patientByEmail = await Patient.findOne({ email: req.user.email });
        if (patientByEmail) {
          patient = patientByEmail;
        }
      }

      if (patient) {
        const patientAppointments = { patient: patient._id };
        stats = {
          totalPatients: 1, // Only themselves
          totalDoctors: await Doctor.countDocuments(), // Patients can see all doctors
          totalAppointments: await Appointment.countDocuments(patientAppointments),
          todayAppointments: await Appointment.countDocuments({
            ...patientAppointments,
            dateTime: { $gte: startOfDay, $lt: endOfDay },
            status: { $ne: 'cancelled' }
          }),
          upcomingAppointments: await Appointment.countDocuments({
            ...patientAppointments,
            dateTime: { $gte: new Date() },
            status: { $nin: ['cancelled', 'completed'] }
          }),
          completedAppointments: await Appointment.countDocuments({
            ...patientAppointments,
            dateTime: { $gte: startOfDay, $lt: endOfDay },
            status: 'completed'
          })
        };
      } else {
        // No patient record found
        stats = {
          totalPatients: 0,
          totalDoctors: await Doctor.countDocuments(),
          totalAppointments: 0,
          todayAppointments: 0,
          upcomingAppointments: 0,
          completedAppointments: 0
        };
      }
    } else {
      // Unknown role
      stats = {
        totalPatients: 0,
        totalDoctors: 0,
        totalAppointments: 0,
        todayAppointments: 0,
        upcomingAppointments: 0,
        completedAppointments: 0
      };
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Get appointment stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/appointments/upcoming
// @desc    Get upcoming appointments
// @access  Private
router.get('/upcoming', protect, async (req, res) => {
  try {
    const Patient = require('../models/Patient');
    const Doctor = require('../models/Doctor');
    
    let query = {
      dateTime: { $gte: new Date() },
      status: { $nin: ['cancelled', 'completed'] }
    };

    // Role-based filtering
    if (req.user.role === 'doctor') {
      // Doctor sees only their assigned appointments
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor) {
        // Fallback: try to find by email (backward compatibility)
        const doctorByEmail = await Doctor.findOne({ email: req.user.email });
        if (doctorByEmail) {
          doctor = doctorByEmail;
        }
      }
      
      if (doctor) {
        query.doctor = doctor._id;
      } else {
        // No doctor record found, return empty results
        return res.json([]);
      }
    } else if (req.user.role === 'patient') {
      // Patient sees only their own appointments
      let patient = await Patient.findOne({ user: req.user._id });
      if (!patient) {
        // Fallback: try to find by email (backward compatibility)
        const patientByEmail = await Patient.findOne({ email: req.user.email });
        if (patientByEmail) {
          patient = patientByEmail;
        }
      }
      
      if (patient) {
        query.patient = patient._id;
      } else {
        // No patient record found, return empty results
        return res.json([]);
      }
    }
    // Admin sees all appointments (no additional filtering)

    const upcomingAppointments = await Appointment.find(query)
      .populate('patient', 'name contact')
      .populate('doctor', 'name specialization')
      .sort({ dateTime: 1 })
      .limit(10);
    
    res.json(upcomingAppointments);
  } catch (error) {
    console.error('Get upcoming appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/appointments/today
// @desc    Get today's appointments
// @access  Private
router.get('/today', protect, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const todayAppointments = await Appointment.find({
      dateTime: { $gte: startOfDay, $lt: endOfDay }
    })
    .populate('patient', 'name contact')
    .populate('doctor', 'name specialization')
    .sort({ dateTime: 1 });
    
    res.json(todayAppointments);
  } catch (error) {
    console.error('Get today appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/appointments/:id
// @desc    Get appointment by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name contact')
      .populate('doctor', 'name specialization');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    res.json(appointment);
  } catch (error) {
    console.error('Get appointment error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/appointments
// @desc    Create a new appointment
// @access  Private (Admin, Doctor, Patient)
router.post('/', [
  protect,
  authorize('admin', 'doctor', 'patient'),
  [
    body('patient').custom((value, { req }) => {
      // Only require patient ID for admin and doctor users
      if (req.user.role !== 'patient' && !value) {
        throw new Error('Patient ID is required');
      }
      return true;
    }),
    body('doctor').notEmpty().withMessage('Doctor ID is required'),
    body('dateTime').isISO8601().withMessage('Valid appointment date is required'),
    body('reason').notEmpty().withMessage('Appointment reason is required'),
    body('status').optional().isIn(['booked', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']).withMessage('Valid status is required')
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Handle patient assignment based on user role
    let appointmentData = { ...req.body };
    
    if (req.user.role === 'patient') {
      // For patient users, try to find or create a patient reference
      const Patient = require('../models/Patient');
      let patient = await Patient.findOne({ user: req.user._id });
      
      if (!patient) {
        // Fallback: try to find by email (backward compatibility)
        patient = await Patient.findOne({ email: req.user.email });
      }
      
      if (!patient) {
        // If no Patient record exists, create a minimal one for the appointment
        try {
          patient = new Patient({
            user: req.user._id, // Link to user account
            name: req.user.username || req.user.email.split('@')[0] || 'Patient',
            email: req.user.email,
            contact: '9999922222', // Default phone number (digits only)
            dateOfBirth: new Date('1990-01-01'), // Default date
            gender: 'Other', // Default gender
            address: 'Address not provided', // Default address
            bloodGroup: 'O+', // Default blood group
            isActive: true
          });
          await patient.save();
        } catch (createError) {
          console.error('Error creating patient record:', createError);
          console.error('Validation errors:', createError.errors);
          
          // If it's a duplicate key error, try to find the existing patient
          if (createError.code === 11000) {
            try {
              patient = await Patient.findOne({ email: req.user.email });
              if (patient) {
                // Found existing patient after duplicate key error
                // Update the patient record to link to user
                patient.user = req.user._id;
                await patient.save();
              } else {
                return res.status(500).json({ 
                  message: 'Unable to create patient record. Please contact administrator.',
                  details: 'Duplicate email error but patient not found'
                });
              }
            } catch (findError) {
              return res.status(500).json({ 
                message: 'Unable to create patient record. Please contact administrator.',
                details: findError.message 
              });
            }
          } else {
            return res.status(500).json({ 
              message: 'Unable to create patient record. Please contact administrator.',
              details: createError.message 
            });
          }
        }
      } else if (!patient.user) {
        // If patient exists but doesn't have user reference, update it
        try {
          patient.user = req.user._id;
          await patient.save();
        } catch (updateError) {
          console.error('Error updating patient user reference:', updateError);
        }
      }
      
      appointmentData.patient = patient._id;
    }

    // Validate doctor exists before saving
    try {
      const DoctorModel = require('../models/Doctor');
      const doctorExists = await DoctorModel.findById(appointmentData.doctor).lean();
      if (!doctorExists) {
        return res.status(400).json({ message: 'Doctor not found' });
      }
    } catch (e) {
      console.error('Doctor lookup failed:', e.message);
      return res.status(400).json({ message: 'Invalid doctor id' });
    }

    const newAppointment = new Appointment(appointmentData);
    await newAppointment.save();
    
    await newAppointment.populate('patient', 'name contact');
    await newAppointment.populate('doctor', 'name specialization');
    
    res.status(201).json(newAppointment);
  } catch (error) {
    console.error('Create appointment error:', error);
    if (error.message === 'Appointment time conflicts with existing appointment') {
      return res.status(400).json({ message: 'Appointment time conflicts with existing appointment' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors || {}).map(e => e.message);
      return res.status(400).json({ message: 'Validation failed', errors: messages });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/appointments/:id
// @desc    Update appointment
// @access  Private (Admin, Doctor)
router.put('/:id', [
  protect,
  authorize('admin', 'doctor'),
  [
    body('dateTime').optional().isISO8601().withMessage('Valid appointment date is required'),
    body('reason').optional().notEmpty().withMessage('Appointment reason cannot be empty'),
    body('status').optional().isIn(['booked', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']).withMessage('Valid status is required'),
    body('notes').optional().isString().withMessage('Notes must be a string')
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Only admin and doctor roles can update appointments
    // Patient role is no longer allowed to update appointments

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        appointment[key] = req.body[key];
      }
    });

    await appointment.save();
    await appointment.populate('patient', 'name contact');
    await appointment.populate('doctor', 'name specialization');
    
    res.json(appointment);
  } catch (error) {
    console.error('Update appointment error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (error.message === 'Appointment time conflicts with existing appointment') {
      return res.status(400).json({ message: 'Appointment time conflicts with existing appointment' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/appointments/:id
// @desc    Delete appointment
// @access  Private (Admin, Doctor, Patient - patients can only delete their own appointments)
router.delete('/:id', [protect, authorize('admin', 'doctor', 'patient')], async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Patients can only delete their own appointment
    if (req.user.role === 'patient') {
      const PatientModel = require('../models/Patient');
      const patient = await PatientModel.findOne({ email: req.user.email });
      let owns = false;
      if (patient && appointment.patient && appointment.patient.toString() === patient._id.toString()) {
        owns = true;
      } else {
        try {
          await appointment.populate('patient', 'email');
          if (appointment.patient && appointment.patient.email && appointment.patient.email.toLowerCase() === (req.user.email || '').toLowerCase()) {
            owns = true;
          }
        } catch (_) {}
      }
      if (!owns) {
        return res.status(403).json({ message: 'Not authorized to delete this appointment' });
      }
    }

    await appointment.deleteOne();
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/appointments/:id/status
// @desc    Update appointment status
// @access  Private (Admin, Doctor)
router.put('/:id/status', [
  protect,
  authorize('admin', 'doctor'),
  [
    body('status').isIn(['booked', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']).withMessage('Valid status is required'),
    body('notes').optional().isString().withMessage('Notes must be a string')
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.status = req.body.status;
    if (req.body.notes) {
      appointment.notes = req.body.notes;
    }

    await appointment.save();
    await appointment.populate('patient', 'name contact');
    await appointment.populate('doctor', 'name specialization');
    
    res.json(appointment);
  } catch (error) {
    console.error('Update appointment status error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

