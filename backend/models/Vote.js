// models/Vote.js
const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  conference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conference',
    required: true,
  },
  votingOpen: {
    type: Boolean,
    default: false,
  },
  votes: [
    {
      voter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserConferenceRole',
        required: true,
      },
      choice: {
        type: String,
        enum: ['yes', 'no', 'abstain'],
        required: true,
      },
      votedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  openedAt: {
    type: Date,
  },
  closedAt: {
    type: Date,
  },
});

module.exports = mongoose.model('Vote', VoteSchema);
