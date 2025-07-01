const mongoose = require('mongoose');

const conferenceSchema = new mongoose.Schema({
  conferenceName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Conference name cannot exceed 1000 characters']
  },
  committeeName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Committee name cannot exceed 1000 characters'],
    unique: true // Committee names must be unique
  },
  committeeIssue: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Committee issue cannot exceed 1000 characters']
  },
  conferenceCode: {
    type: String,
    required: true,
    unique: true,
    length: [12, 'Conference code must be exactly 12 digits'],
    match: [/^\d{12}$/, 'Conference code must contain only numbers']
  },
  creator: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed', 'cancelled'],
    default: 'active'
  },
  folderPath: {
    type: String,
    required: true
  },
  people: [
    {
      email: { type: String, required: true, lowercase: true, trim: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      role: { type: String, enum: ['god', 'owner', 'admin', 'chair', 'delegate', 'moderator'], required: true },
      country: { type: String, default: '' }, // Only for delegates
      addedAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }
  ]
}, {
  timestamps: true,
  collection: 'conferences'
});

// Index for efficient queries
conferenceSchema.index({ conferenceCode: 1 });
conferenceSchema.index({ committeeName: 1 });
conferenceSchema.index({ creator: 1 });
conferenceSchema.index({ status: 1 });

// Pre-save middleware to ensure conference code is unique
conferenceSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Check if conference code already exists
    const existingConference = await this.constructor.findOne({ conferenceCode: this.conferenceCode });
    if (existingConference) {
      throw new Error('Conference code already exists. Please try again.');
    }
  }
  next();
});

// Static method to generate unique conference code
conferenceSchema.statics.generateUniqueCode = async function() {
  let code;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    // Generate 12-digit random number
    code = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    attempts++;
    
    if (attempts > maxAttempts) {
      throw new Error('Unable to generate unique conference code after maximum attempts');
    }
  } while (await this.findOne({ conferenceCode: code }));
  
  return code;
};

// Static method to check if committee name exists
conferenceSchema.statics.isCommitteeNameTaken = async function(committeeName) {
  const existing = await this.findOne({ committeeName: committeeName });
  return !!existing;
};

// Instance method to get formatted folder name
conferenceSchema.methods.getFolderName = function() {
  // Remove special characters and replace spaces with underscores for folder name
  const safeConferenceName = this.conferenceName
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50); // Limit length for folder name
  
  return `${this.conferenceCode} - ${safeConferenceName}`;
};

module.exports = mongoose.model('Conference', conferenceSchema); 