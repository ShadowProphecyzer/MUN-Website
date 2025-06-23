const mongoose = require('mongoose');

const ConferenceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true }, // unique conference code for joining
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },

  // Optional: track participants or metadata as needed
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: Number, enum: [1, 2, 3, 4] }, // 1-owner/editor, 2-moderator, 3-chair, 4-delegate
    country: { type: String } // For delegates
  }],
});

module.exports = mongoose.model('Conference', ConferenceSchema);
