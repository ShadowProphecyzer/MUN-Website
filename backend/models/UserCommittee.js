const mongoose = require('mongoose');

const UserCommitteeSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  conferenceCode: { 
    type: String, 
    required: true 
  },
  conferenceName: { 
    type: String, 
    required: true 
  },
  committeeName: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    required: true 
  },
  country: { 
    type: String 
  },
  dateAdded: { 
    type: Date, 
    default: Date.now 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true
});

// Compound index to ensure unique user-conference combinations
UserCommitteeSchema.index({ userId: 1, conferenceCode: 1 }, { unique: true });

// Index for efficient queries
UserCommitteeSchema.index({ userId: 1, isActive: 1 });
UserCommitteeSchema.index({ conferenceCode: 1 });

module.exports = mongoose.model('UserCommittee', UserCommitteeSchema); 