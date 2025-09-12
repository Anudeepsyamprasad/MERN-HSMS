const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/medical-records
// @desc    Get all medical records (filtered by role)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const MedicalRecord = require('../models/MedicalRecord');
    let query = {};
    
    // Filter by role and user permissions
    if (req.user.role === 'patient') {
      // Patients can only see their own medical records
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
          medicalRecords: [],
          pagination: {
            current: page,
            pages: 0,
            total: 0
          }
        });
      }
    } else if (req.user.role === 'doctor') {
      // Doctors can see medical records where they are the assigned doctor
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
    // Admin can see all medical records (no additional filtering)
    
    // Search functionality
    if (req.query.search) {
      query.$or = [
        { diagnosis: { $regex: req.query.search, $options: 'i' } },
        { notes: { $regex: req.query.search, $options: 'i' } },
        { 'patient.name': { $regex: req.query.search, $options: 'i' } },
        { 'doctor.name': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filter by patient if specified
    if (req.query.patient) {
      query.patient = req.query.patient;
    }

    // Filter by doctor if specified
    if (req.query.doctor) {
      query.doctor = req.query.doctor;
    }

    // Filter by date range if specified
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const total = await MedicalRecord.countDocuments(query);
    const medicalRecords = await MedicalRecord.find(query)
      .populate('patient', 'name email contact')
      .populate('doctor', 'name specialization contact')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      medicalRecords,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/medical-records/:id
// @desc    Get medical record by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const MedicalRecord = require('../models/MedicalRecord');
    const medicalRecord = await MedicalRecord.findById(req.params.id)
      .populate('patient', 'name email contact')
      .populate('doctor', 'name specialization contact');

    if (!medicalRecord) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    // Check if user has permission to view this record
    if (req.user.role === 'patient') {
      const Patient = require('../models/Patient');
      let patient = await Patient.findOne({ user: req.user._id });
      
      if (!patient) {
        patient = await Patient.findOne({ email: req.user.email });
      }
      
      if (!patient || medicalRecord.patient._id.toString() !== patient._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this medical record' });
      }
    } else if (req.user.role === 'doctor') {
      const Doctor = require('../models/Doctor');
      let doctor = await Doctor.findOne({ user: req.user._id });
      
      if (!doctor) {
        doctor = await Doctor.findOne({ email: req.user.email });
      }
      
      if (!doctor || medicalRecord.doctor._id.toString() !== doctor._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this medical record' });
      }
    }

    res.json(medicalRecord);
  } catch (error) {
    console.error('Get medical record error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Medical record not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/medical-records
// @desc    Create a new medical record
// @access  Private (Admin, Doctor)
router.post('/', [
  protect,
  authorize('admin', 'doctor'),
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('doctorId').notEmpty().withMessage('Doctor ID is required'),
    body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
    body('symptoms').optional().isArray().withMessage('Symptoms must be an array'),
    body('treatment').notEmpty().withMessage('Treatment is required'),
    body('medications').optional().isArray().withMessage('Medications must be an array'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    body('followUpDate').optional().isISO8601().withMessage('Valid follow-up date is required')
  ]
], async (req, res) => {
  try {
    console.log('Medical record creation request:', {
      body: req.body,
      user: req.user,
      userRole: req.user?.role
    });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    // Get patient and doctor details from database
    const Patient = require('../models/Patient');
    const Doctor = require('../models/Doctor');

    // Find patient by provided patientId (only admin/doctor can create records)
    const patientId = req.body.patientId;
    const resolvedPatient = await Patient.findById(patientId).lean();
    if (!resolvedPatient) {
      return res.status(400).json({ message: 'Patient not found' });
    }

    // Find doctor by provided doctorId
    const doctorId = req.body.doctorId;
    const doctor = await Doctor.findById(doctorId).lean();
    if (!doctor) {
      return res.status(400).json({ message: 'Doctor not found' });
    }

    const recordData = {
      patient: resolvedPatient._id, // ObjectId reference
      doctor: doctor._id, // ObjectId reference
      diagnosis: req.body.diagnosis,
      symptoms: req.body.symptoms || [],
      treatmentPlan: req.body.treatment, // Map treatment to treatmentPlan
      notes: req.body.notes || '',
      followUpDate: req.body.followUpDate || null,
      visitDate: req.body.visitDate ? new Date(req.body.visitDate) : new Date(), // Handle visit date
      vitalSigns: req.body.vitalSigns || {},
      severity: req.body.severity || 'mild',
      allergies: req.body.allergies || [],
      currentMedications: req.body.currentMedications || [],
      familyHistory: req.body.familyHistory || '',
      socialHistory: req.body.socialHistory || {}
    };

    // Create medical record in database
    const MedicalRecord = require('../models/MedicalRecord');
    const newRecord = new MedicalRecord(recordData);
    await newRecord.save();
    
    // Populate patient and doctor data for response
    await newRecord.populate('patient', 'name email contact');
    await newRecord.populate('doctor', 'name specialization contact');
    
    res.status(201).json(newRecord);
  } catch (error) {
    console.error('Create medical record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/medical-records/:id
// @desc    Update medical record
// @access  Private (Admin, Doctor)
router.put('/:id', [
  protect,
  authorize('admin', 'doctor'),
  [
    body('diagnosis').optional().notEmpty().withMessage('Diagnosis cannot be empty'),
    body('symptoms').optional().isArray().withMessage('Symptoms must be an array'),
    body('treatment').optional().notEmpty().withMessage('Treatment cannot be empty'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    body('followUpDate').optional().isISO8601().withMessage('Valid follow-up date is required'),
    body('visitDate').optional().isISO8601().withMessage('Valid visit date is required')
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const MedicalRecord = require('../models/MedicalRecord');
    const medicalRecord = await MedicalRecord.findById(req.params.id).populate('doctor', 'email user');
    
    if (!medicalRecord) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    // Authorization: allow any authenticated doctor to update records
    // Business rule: Doctors are permitted to update medical records regardless of original assignee
    // (admin restriction still enforced by authorize middleware above)

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        if (key === 'treatment') {
          medicalRecord.treatmentPlan = req.body[key]; // Map treatment to treatmentPlan
        } else if (key === 'visitDate') {
          medicalRecord.visitDate = new Date(req.body[key]); // Handle visit date conversion
        } else {
          medicalRecord[key] = req.body[key];
        }
      }
    });

    await medicalRecord.save();
    await medicalRecord.populate('patient', 'name email contact');
    await medicalRecord.populate('doctor', 'name specialization contact');
    
    res.json(medicalRecord);
  } catch (error) {
    console.error('Update medical record error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Medical record not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/medical-records/:id
// @desc    Delete medical record
// @access  Private (Admin, Doctor)
router.delete('/:id', [protect, authorize('admin', 'doctor')], async (req, res) => {
  try {
    const MedicalRecord = require('../models/MedicalRecord');
    const medicalRecord = await MedicalRecord.findById(req.params.id).populate('doctor', 'email user');
    
    if (!medicalRecord) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    // Check if user has permission to delete this record
    if (req.user.role === 'doctor') {
      const Doctor = require('../models/Doctor');
      let doctor = await Doctor.findOne({ user: req.user._id });

      if (!doctor) {
        doctor = await Doctor.findOne({ email: req.user.email });
      }

      const isOwnerById = doctor && medicalRecord.doctor && (
        (medicalRecord.doctor._id ? medicalRecord.doctor._id.toString() : medicalRecord.doctor.toString()) === doctor._id.toString()
      );
      const isOwnerByEmail = medicalRecord.doctor && medicalRecord.doctor.email && (medicalRecord.doctor.email === req.user.email);
      const isOwnerByLinkedUser = medicalRecord.doctor && medicalRecord.doctor.user && (medicalRecord.doctor.user.toString() === req.user._id.toString());

      if (!isOwnerById && !isOwnerByEmail && !isOwnerByLinkedUser) {
        return res.status(403).json({ message: 'Not authorized to delete this medical record' });
      }
    }

    await medicalRecord.deleteOne();
    res.json({ message: 'Medical record deleted successfully' });
  } catch (error) {
    console.error('Delete medical record error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Medical record not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/medical-records/patient/:patientId
// @desc    Get medical records for a specific patient
// @access  Private (Admin, Doctor)
router.get('/patient/:patientId', [protect, authorize('admin', 'doctor')], async (req, res) => {
  try {
    const MedicalRecord = require('../models/MedicalRecord');
    const medicalRecords = await MedicalRecord.find({ patient: req.params.patientId })
      .populate('patient', 'name email contact')
      .populate('doctor', 'name specialization contact')
      .sort({ createdAt: -1 });

    res.json(medicalRecords);
  } catch (error) {
    console.error('Get patient medical records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/medical-records/doctor/:doctorId
// @desc    Get medical records for a specific doctor
// @access  Private (Admin, Doctor)
router.get('/doctor/:doctorId', [protect, authorize('admin', 'doctor')], async (req, res) => {
  try {
    const MedicalRecord = require('../models/MedicalRecord');
    const medicalRecords = await MedicalRecord.find({ doctor: req.params.doctorId })
      .populate('patient', 'name email contact')
      .populate('doctor', 'name specialization contact')
      .sort({ createdAt: -1 });

    res.json(medicalRecords);
  } catch (error) {
    console.error('Get doctor medical records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
