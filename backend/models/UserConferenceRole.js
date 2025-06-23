// models/UserConferenceRole.js
const mongoose = require('mongoose');

const UserConferenceRoleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  conference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conference',
    required: true,
  },
  role: {
    type: String,
    enum: ['owner', 'editor', 'moderator', 'chair', 'delegate'],
    required: true,
  },
  country: {
    type: String,
    default: '', // For delegates, their country
  }
}, {
  timestamps: true,
});

UserConferenceRoleSchema.index({ user: 1, conference: 1 }, { unique: true });

module.exports = mongoose.model('UserConferenceRole', UserConferenceRoleSchema);
