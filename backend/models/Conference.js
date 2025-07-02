const mongoose = require('mongoose');

const ConferenceSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // 12-digit unique code
  name: { type: String, required: true },
  committeeName: { type: String, required: true },
  committeeIssue: { type: String, required: true }, // Committee issue/topic
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Conference', ConferenceSchema); 