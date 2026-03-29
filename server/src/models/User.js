const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },

  firstName: {
    type: String,
    required: true,
    trim: true,
  },

  lastName: {
    type: String,
    required: true,
    trim: true,
  },

  password: {
    type: String,
    required: function () {
      return this.role !== 'invitee'; // invitees don’t need password
    },
  },

  role: {
    type: String,
    enum: ['invitee', 'admin', 'super_admin'],
    default: 'invitee',
  },

  // For invitees (future OTP verification)
  otp: {
    code: String,
    expiresAt: Date,
  },

  // Optional: track which event they belong to
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
  },

}, {
  timestamps: { createdAt: true, updatedAt: true }
});

userSchema.index({ email: 1, eventId: 1 }, { unique: true });

/*
userSchema.pre('save', function (next) {
  this.email = this.email.toLowerCase();
  next();
});
*/

module.exports = mongoose.model('User', userSchema);