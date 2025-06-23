// models/Amendment.js
const mongoose = require('mongoose');

const AmendmentSchema = new mongoose.Schema({
  conference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conference',
    required: true,
  },
  submitter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserConferenceRole',
    required: true,
  },
  number: {
    type: Number,
    required: true,
  },
  letter: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
  },
  romanNumeral: {
    type: String,
    required: true,
    enum: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'],
  },
  friendly: {
    type: Boolean,
    default: false,
  },
  content: {
    type: String,
    required: true,
  },
  approved: {
    type: String,
    enum: ['pending', 'approved', 'declined'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Amendment', AmendmentSchema);
