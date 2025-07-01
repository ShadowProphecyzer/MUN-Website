const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  token: {
    type: Number,
    required: true,
    unique: true,
    default: function() {
      // Generate sequential token number
      return Date.now();
    }
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please enter a valid email address'
    ]
  },
  message: {
    type: String,
    required: true,
    trim: true,
    minlength: [10, 'Message must be at least 10 characters long'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'contacts' // Store in 'contacts' collection
});

// Index for efficient queries
contactSchema.index({ email: 1, timestamp: -1 });
contactSchema.index({ token: 1 });

module.exports = mongoose.model('Contact', contactSchema); 