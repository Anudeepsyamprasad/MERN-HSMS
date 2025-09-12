const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
  medication: {
    type: String,
    required: true,
    trim: true
  },
  dosage: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  instructions: {
    type: String
  }
});

const VitalSignsSchema = new mongoose.Schema({
  bloodPressure: {
    systolic: Number,
    diastolic: Number
  },
  heartRate: Number,
  temperature: Number,
  respiratoryRate: Number,
  oxygenSaturation: Number,
  weight: Number,
  height: Number
});

const MedicalRecordSchema = new mongoose.Schema({
  patient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  doctor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: true 
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  diagnosis: { 
    type: String, 
    required: true,
    maxlength: 1000
  },
  symptoms: [{
    type: String,
    maxlength: 200
  }],
  prescription: [PrescriptionSchema],
  vitalSigns: VitalSignsSchema,
  notes: { 
    type: String,
    maxlength: 2000
  },
  treatmentPlan: {
    type: String,
    maxlength: 1000
  },
  followUpDate: {
    type: Date
  },
  visitDate: {
    type: Date,
    default: Date.now
  },
  labResults: [{
    testName: String,
    result: String,
    normalRange: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  imagingResults: [{
    type: String,
    description: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  allergies: [String],
  currentMedications: [String],
  familyHistory: {
    type: String,
    maxlength: 500
  },
  socialHistory: {
    smoking: Boolean,
    alcohol: Boolean,
    occupation: String,
    lifestyle: String
  },
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe', 'critical'],
    default: 'mild'
  },
  isConfidential: {
    type: Boolean,
    default: false
  },
  attachments: [{
    fileName: String,
    fileType: String,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for better query performance
MedicalRecordSchema.index({ patient: 1, date: -1 });
MedicalRecordSchema.index({ doctor: 1, date: -1 });
MedicalRecordSchema.index({ appointment: 1 });

// Virtual for date (alias for createdAt)
MedicalRecordSchema.virtual('date').get(function() {
  return this.createdAt;
});

// Method to get formatted vital signs
MedicalRecordSchema.methods.getFormattedVitalSigns = function() {
  if (!this.vitalSigns) return null;
  
  return {
    bloodPressure: this.vitalSigns.bloodPressure ? 
      `${this.vitalSigns.bloodPressure.systolic}/${this.vitalSigns.bloodPressure.diastolic} mmHg` : 'N/A',
    heartRate: this.vitalSigns.heartRate ? `${this.vitalSigns.heartRate} bpm` : 'N/A',
    temperature: this.vitalSigns.temperature ? `${this.vitalSigns.temperature}°F` : 'N/A',
    respiratoryRate: this.vitalSigns.respiratoryRate ? `${this.vitalSigns.respiratoryRate} breaths/min` : 'N/A',
    oxygenSaturation: this.vitalSigns.oxygenSaturation ? `${this.vitalSigns.oxygenSaturation}%` : 'N/A',
    weight: this.vitalSigns.weight ? `${this.vitalSigns.weight} kg` : 'N/A',
    height: this.vitalSigns.height ? `${this.vitalSigns.height} cm` : 'N/A'
  };
};

// Method to check if record is recent (within 30 days)
MedicalRecordSchema.methods.isRecent = function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.createdAt > thirtyDaysAgo;
};

module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema);

