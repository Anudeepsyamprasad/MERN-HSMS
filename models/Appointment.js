const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
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
  dateTime: { 
    type: Date, 
    required: true 
  },
  duration: {
    type: Number,
    default: 30, // minutes
    min: 15,
    max: 120
  },
  status: { 
    type: String, 
    enum: ['booked', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'], 
    default: 'booked' 
  },
  type: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'routine-checkup'],
    default: 'consultation'
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: {
    type: Date
  },
  cancelledBy: {
    type: String,
    enum: ['patient', 'doctor', 'admin']
  },
  cancellationReason: {
    type: String,
    maxlength: 500
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  amount: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
AppointmentSchema.index({ patient: 1, dateTime: 1 });
AppointmentSchema.index({ doctor: 1, dateTime: 1 });
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({ dateTime: 1 });

// Pre-save middleware to check for conflicts
AppointmentSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('dateTime') || this.isModified('doctor')) {
    const startTime = new Date(this.dateTime);
    const endTime = new Date(startTime.getTime() + this.duration * 60000);
    
    // Check for overlapping appointments
    const existingAppointments = await this.constructor.find({
      doctor: this.doctor,
      _id: { $ne: this._id },
      status: { $nin: ['cancelled', 'no-show'] }
    });
    
    for (const existing of existingAppointments) {
      const existingStart = new Date(existing.dateTime);
      const existingEnd = new Date(existingStart.getTime() + existing.duration * 60000);
      
      // Check if appointments overlap
      if (startTime < existingEnd && endTime > existingStart) {
        return next(new Error('Appointment time conflicts with existing appointment'));
      }
    }
  }
  next();
});

// Method to check if appointment is in the past
AppointmentSchema.methods.isPast = function() {
  return this.dateTime < new Date();
};

// Method to check if appointment is today
AppointmentSchema.methods.isToday = function() {
  const today = new Date();
  const appointmentDate = new Date(this.dateTime);
  return today.toDateString() === appointmentDate.toDateString();
};

// Method to get appointment duration in minutes
AppointmentSchema.methods.getDurationInMinutes = function() {
  return this.duration;
};

module.exports = mongoose.model('Appointment', AppointmentSchema);

