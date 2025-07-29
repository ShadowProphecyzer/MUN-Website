const mongoose = require('mongoose');

const HierarchicalNoteSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
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
    enum: ['waiting', 'approved', 'rejected'],
    default: 'waiting'
  },
  senderRole: {
    type: String,
    enum: ['god', 'owner', 'administrator', 'moderator', 'chair', 'delegate'],
    required: true
  },
  recipientRole: {
    type: String,
    enum: ['god', 'owner', 'administrator', 'moderator', 'chair', 'delegate'],
    required: true
  },
  requiresApproval: {
    type: Boolean,
    default: true
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
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lockedAt: {
    type: Date
  },
  escalationNotified: {
    type: Boolean,
    default: false
  },
  escalationTime: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HierarchicalNote'
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HierarchicalNote'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
HierarchicalNoteSchema.index({ sender: 1, recipient: 1 });
HierarchicalNoteSchema.index({ conference: 1 });
HierarchicalNoteSchema.index({ status: 1 });
HierarchicalNoteSchema.index({ createdAt: -1 });
HierarchicalNoteSchema.index({ lockedBy: 1 });
HierarchicalNoteSchema.index({ threadId: 1 });

module.exports = mongoose.model('HierarchicalNote', HierarchicalNoteSchema); 