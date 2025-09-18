const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  day: { 
    type: String, 
    required: true,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  },
  from: { 
    type: String, 
    required: true,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
  },
  to: { 
    type: String, 
    required: true,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
});

const DoctorSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false 
  },
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  specialization: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  contact: { 
    type: String, 
    required: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  experience: {
    type: Number,
    min: 0,
    max: 50
  },
  education: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  schedule: [ScheduleSchema],
  consultationFee: {
    type: Number,
    min: 0
  },
  address: {
    type: String,
    required: true,
    maxlength: 500
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
DoctorSchema.index({ user: 1 });
DoctorSchema.index({ specialization: 1 });
DoctorSchema.index({ licenseNumber: 1 });

// Method to check if doctor is available on a specific day and time
DoctorSchema.methods.isAvailableAt = function(day, time) {
  const schedule = this.schedule.find(s => s.day.toLowerCase() === day.toLowerCase() && s.isAvailable);
  if (!schedule) return false;
  
  const timeValue = new Date(`2000-01-01T${time}`);
  const fromValue = new Date(`2000-01-01T${schedule.from}`);
  const toValue = new Date(`2000-01-01T${schedule.to}`);
  
  return timeValue >= fromValue && timeValue <= toValue;
};

module.exports = mongoose.model('Doctor', DoctorSchema);
