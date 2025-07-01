const mongoose = require('mongoose');

const AwardSchema = new mongoose.Schema({
  conferenceCode: { type: String, required: true, unique: true },
  bestDelegate: { type: String, default: '' },
  honourableMention: { type: String, default: '' },
  bestPositionPaper: { type: String, default: '' }
});

module.exports = AwardSchema; 