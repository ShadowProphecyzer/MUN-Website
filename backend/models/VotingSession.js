const mongoose = require('mongoose');

const VotingSessionSchema = new mongoose.Schema({
  open: { type: Boolean, default: true },
  openedAt: { type: Date, default: Date.now },
  closedAt: { type: Date },
  openedBy: { type: String },
  closedBy: { type: String },
  votes: { type: Map, of: String, default: {} }, // userId -> 'for'|'against'|'abstain'
  results: {
    for: { type: Number, default: 0 },
    against: { type: Number, default: 0 },
    abstain: { type: Number, default: 0 },
    notParticipating: { type: Number, default: 0 }
  },
  conferenceCode: { type: String, required: true }
});

module.exports = VotingSessionSchema; 