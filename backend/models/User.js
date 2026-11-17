const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  passwordHash: { 
    type: String, 
    required: true,
    minlength: 6
  },
  role: { 
    type: String, 
    enum: ['patient', 'doctor', 'admin'], 
    required: true,
    default: 'patient'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Virtual for password (not stored in DB).
// Setting user.password only remembers the plain text; it is hashed in the
// pre-validate hook below so hashing never blocks the event loop.
UserSchema.virtual('password')
  .set(function(password) {
    this._plainPassword = password;
    // Placeholder so the "required" check passes; replaced before saving.
    if (!this.passwordHash) this.passwordHash = 'pending-hash';
  });

UserSchema.pre('validate', async function() {
  if (this._plainPassword) {
    this.passwordHash = await bcrypt.hash(this._plainPassword, 12);
    this._plainPassword = undefined;
  }
});

// Method to compare password (async: always use `await user.comparePassword(...)`)
UserSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to get public profile
UserSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.passwordHash;
  return userObject;
};

module.exports = mongoose.model('User', UserSchema);
