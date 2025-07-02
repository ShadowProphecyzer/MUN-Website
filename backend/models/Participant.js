const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true, default: 'unassigned' },
  country: { type: String },
  createdAt: { type: Date, default: Date.now },
  isLocked: { type: Boolean, default: false } // For GOD/Owner
});

module.exports = ParticipantSchema; 