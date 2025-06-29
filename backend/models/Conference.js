const mongoose = require('mongoose');

const ConferenceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true }, // unique conference code for joining
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },

  // Conference participants with their roles in this specific conference
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { 
      type: String, 
      enum: ['god', 'owner', 'admin', 'moderator', 'chair', 'delegate'],
      default: 'delegate'
    },
    country: { type: String }, // For delegates
    joinedAt: { type: Date, default: Date.now }
  }],

  // Conference settings
  settings: {
    allowPublicJoin: { type: Boolean, default: false },
    requireApproval: { type: Boolean, default: true },
    maxParticipants: { type: Number, default: 100 },
    description: { type: String, default: '' }
  }
});

// Ensure owner is always in participants list
ConferenceSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('owner')) {
    // Add owner to participants if not already there
    const ownerExists = this.participants.some(p => p.user.toString() === this.owner.toString());
    if (!ownerExists) {
      this.participants.push({
        user: this.owner,
        role: 'owner',
        joinedAt: new Date()
      });
    }
  }

  // Add God to all conferences if not already present
  try {
    const User = require('./User');
    const godEmail = process.env.GOD_EMAIL;
    
    if (godEmail) {
      const godUser = await User.findOne({ email: godEmail });
      if (godUser) {
        const godExists = this.participants.some(p => p.user.toString() === godUser._id.toString());
        if (!godExists) {
          this.participants.push({
            user: godUser._id,
            role: 'god',
            joinedAt: new Date()
          });
        }
      }
    }
  } catch (error) {
    console.error('Error adding God to conference:', error);
  }

  next();
});

// Prevent God from being removed from participants
ConferenceSchema.pre('save', function(next) {
  if (this.isModified('participants')) {
    const User = require('./User');
    const godEmail = process.env.GOD_EMAIL;
    
    if (godEmail) {
      User.findOne({ email: godEmail }).then(godUser => {
        if (godUser) {
          const godStillPresent = this.participants.some(p => p.user.toString() === godUser._id.toString());
          if (!godStillPresent) {
            // Re-add God if they were removed
            this.participants.push({
              user: godUser._id,
              role: 'god',
              joinedAt: new Date()
            });
          }
        }
      }).catch(err => {
        console.error('Error checking God presence:', err);
      });
    }
  }
  next();
});

module.exports = mongoose.model('Conference', ConferenceSchema);
