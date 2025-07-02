const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true, default: 'unassigned' },
  country: { type: String },
  createdAt: { type: Date, default: Date.now },
  isLocked: { type: Boolean, default: false }, // For legacy compatibility, but not enforced
  lock1: { type: Boolean, default: false }, // V2: GOD/Owner cannot be removed by anyone
  lock2: { type: Boolean, default: false }  // V2: Admin cannot be removed by Admin, only by GOD/Owner
});

module.exports = ParticipantSchema; 