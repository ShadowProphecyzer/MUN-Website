// models/ConferenceAward.js
const mongoose = require('mongoose');

const ConferenceAwardSchema = new mongoose.Schema({
  conference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conference',
    required: true,
    unique: true,
  },
  bestDelegate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserConferenceRole',
  },
  honoraryMention: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserConferenceRole',
  },
  bestPositionPaper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserConferenceRole',
  },
});

module.exports = mongoose.model('ConferenceAward', ConferenceAwardSchema);
