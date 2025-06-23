// models/Contribution.js
const mongoose = require('mongoose');

const ContributionSchema = new mongoose.Schema({
  conference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conference',
    required: true,
  },
  userRole: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserConferenceRole',
    required: true,
  },
  speeches: {
    type: Number,
    default: 0,
    min: 0,
  },
  points: {
    type: Number,
    default: 0,
    min: 0,
  },
  amendments: {
    type: Number,
    default: 0,
    min: 0,
  },
  strikes: {
    type: Number,
    default: 0,
    min: 0,
  },
});

module.exports = mongoose.model('Contribution', ContributionSchema);
