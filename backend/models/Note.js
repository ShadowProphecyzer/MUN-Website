// models/Note.js
const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  conference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conference',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserConferenceRole',
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserConferenceRole',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  approved: {
    type: Boolean,
    default: false,
  },
  rejectionReason: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  approvedAt: {
    type: Date,
  },
  readBySender: {
    type: Boolean,
    default: false,
  },
  readByRecipient: {
    type: Boolean,
    default: false,
  }
});

module.exports = mongoose.model('Note', NoteSchema);
