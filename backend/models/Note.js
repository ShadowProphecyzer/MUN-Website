const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conference',
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['sent', 'approved', 'rejected'],
    default: 'sent'
  },
  moderator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String,
    maxlength: 500
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
NoteSchema.index({ sender: 1, recipient: 1 });
NoteSchema.index({ conference: 1 });
NoteSchema.index({ status: 1 });
NoteSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Note', NoteSchema); 