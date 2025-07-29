const express = require('express');
const router = express.Router();
const HierarchicalNote = require('../models/HierarchicalNote');
const Conference = require('../models/Conference');
const { authenticateToken } = require('../middleware/auth');

// Role hierarchy and permissions
const ROLE_HIERARCHY = {
  'god': 6,
  'owner': 5,
  'administrator': 4,
  'moderator': 3,
  'chair': 2,
  'delegate': 1
};

// Permission matrix
const PERMISSIONS = {
  'god': {
    canMessage: ['owner', 'administrator', 'moderator', 'chair', 'delegate'],
    canBeMessaged: false,
    requiresApproval: false
  },
  'owner': {
    canMessage: ['god', 'owner', 'administrator', 'moderator', 'chair', 'delegate'],
    canBeMessaged: true,
    requiresApproval: false
  },
  'administrator': {
    canMessage: ['god', 'owner', 'administrator', 'moderator', 'chair', 'delegate'],
    canBeMessaged: true,
    requiresApproval: true
  },
  'chair': {
    canMessage: ['god', 'owner', 'administrator', 'moderator', 'chair', 'delegate'],
    canBeMessaged: true,
    requiresApproval: true
  },
  'moderator': {
    canMessage: ['god', 'owner', 'administrator', 'moderator', 'chair', 'delegate'],
    canBeMessaged: true,
    requiresApproval: false
  },
  'delegate': {
    canMessage: ['moderator', 'chair', 'administrator', 'owner'],
    canBeMessaged: true,
    requiresApproval: true
  }
};

// Get all participants with hierarchical roles
router.get('/participants/:conferenceId', authenticateToken, async (req, res) => {
  console.log('[HIERARCHICAL-NOTE] GET /participants/:conferenceId - Request received');
  try {
    const { conferenceId } = req.params;
    const currentUser = req.user;
    console.log('[HIERARCHICAL-NOTE] Conference ID:', conferenceId);
    console.log('[HIERARCHICAL-NOTE] Current user:', currentUser.username);

    // Verify conference exists
    const conference = await Conference.findById(conferenceId);
    if (!conference) {
      console.log('[HIERARCHICAL-NOTE] Conference not found');
      return res.status(404).json({
        success: false,
        message: 'Conference not found'
      });
    }

    // Get conference-specific database
    const { getConferenceDb } = require('../services/getConferenceDb');
    const db = getConferenceDb(conference.code);
    const ParticipantSchema = require('../models/Participant');
    const Participant = db.models.Participant || db.model('Participant', ParticipantSchema);

    // Get all participants
    const participants = await Participant.find({
      email: { $ne: currentUser.email }
    }).select('name email role country');

    // Map to expected format and filter based on permissions
    const currentParticipant = await Participant.findOne({ email: currentUser.email });
    if (!currentParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conference'
      });
    }

    const currentRole = currentParticipant.role.toLowerCase();
    const permissions = PERMISSIONS[currentRole] || PERMISSIONS['delegate'];

    const mappedParticipants = participants
      .filter(p => {
        const recipientRole = p.role.toLowerCase();
        return permissions.canMessage.includes(recipientRole);
      })
      .map(p => ({
        _id: p._id,
        username: p.name,
        role: p.role,
        email: p.email,
        country: p.country
      }));

    const responseData = {
      success: true,
      participants: mappedParticipants,
      currentUserRole: currentRole,
      permissions: permissions,
      conference: {
        id: conference._id,
        name: conference.name,
        code: conference.code,
        committeeName: conference.committeeName
      }
    };

    console.log('[HIERARCHICAL-NOTE] Sending response with', mappedParticipants.length, 'participants');
    res.json(responseData);
  } catch (error) {
    console.error('[HIERARCHICAL-NOTE] Error fetching participants:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching participants'
    });
  }
});

// Send a hierarchical note
router.post('/send', authenticateToken, async (req, res) => {
  console.log('[HIERARCHICAL-NOTE] POST /send - Request received');
  try {
    const { recipientId, message, conferenceId, threadId, replyTo } = req.body;
    const currentUser = req.user;
    console.log('[HIERARCHICAL-NOTE] Request data:', { recipientId, message: message.substring(0, 50) + '...', conferenceId });

    // Validate required fields
    if (!recipientId || !message || !conferenceId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient, message, and conference are required'
      });
    }

    // Get conference details
    const conference = await Conference.findById(conferenceId);
    if (!conference) {
      return res.status(404).json({
        success: false,
        message: 'Conference not found'
      });
    }

    // Get conference-specific database
    const { getConferenceDb } = require('../services/getConferenceDb');
    const db = getConferenceDb(conference.code);
    const ParticipantSchema = require('../models/Participant');
    const Participant = db.models.Participant || db.model('Participant', ParticipantSchema);

    // Get sender and recipient details
    const senderParticipant = await Participant.findOne({ email: currentUser.email });
    const recipientParticipant = await Participant.findById(recipientId);

    if (!senderParticipant || !recipientParticipant) {
      return res.status(404).json({
        success: false,
        message: 'Sender or recipient not found in conference'
      });
    }

    const senderRole = senderParticipant.role.toLowerCase();
    const recipientRole = recipientParticipant.role.toLowerCase();

    // Check permissions
    const permissions = PERMISSIONS[senderRole];
    if (!permissions) {
      return res.status(403).json({
        success: false,
        message: 'Invalid sender role'
      });
    }

    // Check if recipient can be messaged
    if (!permissions.canMessage.includes(recipientRole)) {
      return res.status(403).json({
        success: false,
        message: `You cannot message ${recipientRole}s`
      });
    }

    // Check if GOD is being messaged
    if (recipientRole === 'god') {
      return res.status(403).json({
        success: false,
        message: 'Cannot message GOD'
      });
    }

    // Determine if approval is required
    const requiresApproval = permissions.requiresApproval && recipientRole !== 'god';

    // Create new note
    const note = new HierarchicalNote({
      sender: senderParticipant._id,
      recipient: recipientParticipant._id,
      conference: conferenceId,
      message,
      senderRole,
      recipientRole,
      requiresApproval,
      status: requiresApproval ? 'waiting' : 'approved',
      threadId,
      replyTo
    });

    if (!requiresApproval) {
      note.approvedAt = new Date();
    }

    await note.save();
    console.log('[HIERARCHICAL-NOTE] Note saved with ID:', note._id);

    // Construct response with sender/recipient details
    const noteWithDetails = {
      ...note.toObject(),
      sender: {
        _id: senderParticipant._id,
        username: senderParticipant.name,
        role: senderParticipant.role
      },
      recipient: {
        _id: recipientParticipant._id,
        username: recipientParticipant.name,
        role: recipientParticipant.role
      }
    };

    // Emit WebSocket event
    const io = req.app.get('io');
    io.to(`conference-${conferenceId}`).emit('hierarchical-note-created', {
      note: noteWithDetails,
      conferenceId
    });

    console.log('[HIERARCHICAL-NOTE] Note sent successfully');
    res.json({
      success: true,
      message: requiresApproval ? 'Note sent for approval' : 'Note sent successfully',
      note: noteWithDetails
    });
  } catch (error) {
    console.error('[HIERARCHICAL-NOTE] Error sending note:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending note'
    });
  }
});

// Get conversation between users
router.get('/conversation/:recipientId', authenticateToken, async (req, res) => {
  console.log('[HIERARCHICAL-NOTE] GET /conversation/:recipientId - Request received');
  try {
    const { recipientId } = req.params;
    const { conferenceId } = req.query;
    const currentUser = req.user;

    if (!conferenceId) {
      return res.status(400).json({
        success: false,
        message: 'Conference ID is required'
      });
    }

    // Get conference-specific database
    const { getConferenceDb } = require('../services/getConferenceDb');
    const conference = await Conference.findById(conferenceId);
    const db = getConferenceDb(conference.code);
    const ParticipantSchema = require('../models/Participant');
    const Participant = db.models.Participant || db.model('Participant', ParticipantSchema);

    const currentParticipant = await Participant.findOne({ email: currentUser.email });
    if (!currentParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conference'
      });
    }

    // Get conversation notes
    const notes = await HierarchicalNote.find({
      conference: conferenceId,
      $or: [
        { sender: currentParticipant._id, recipient: recipientId },
        { sender: recipientId, recipient: currentParticipant._id }
      ],
      isDeleted: false
    }).sort({ createdAt: 1 });

    // Populate sender and recipient details
    const notesWithDetails = await Promise.all(notes.map(async (note) => {
      const sender = await Participant.findById(note.sender);
      const recipient = await Participant.findById(note.recipient);
      
      return {
        ...note.toObject(),
        sender: {
          _id: sender._id,
          username: sender.name,
          role: sender.role
        },
        recipient: {
          _id: recipient._id,
          username: recipient.name,
          role: recipient.role
        }
      };
    }));

    res.json({
      success: true,
      notes: notesWithDetails
    });
  } catch (error) {
    console.error('[HIERARCHICAL-NOTE] Error loading conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading conversation'
    });
  }
});

// Get pending notes for moderation
router.get('/pending/:conferenceId', authenticateToken, async (req, res) => {
  console.log('[HIERARCHICAL-NOTE] GET /pending/:conferenceId - Request received');
  try {
    const { conferenceId } = req.params;
    const currentUser = req.user;

    // Get conference-specific database
    const conference = await Conference.findById(conferenceId);
    const { getConferenceDb } = require('../services/getConferenceDb');
    const db = getConferenceDb(conference.code);
    const ParticipantSchema = require('../models/Participant');
    const Participant = db.models.Participant || db.model('Participant', ParticipantSchema);

    const currentParticipant = await Participant.findOne({ email: currentUser.email });
    if (!currentParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conference'
      });
    }

    const currentRole = currentParticipant.role.toLowerCase();
    
    // Check if user can moderate
    if (!['god', 'moderator'].includes(currentRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to moderate notes'
      });
    }

    // Get pending notes
    const pendingNotes = await HierarchicalNote.find({
      conference: conferenceId,
      status: 'waiting',
      isDeleted: false,
      $or: [
        { lockedBy: null },
        { lockedBy: currentParticipant._id }
      ]
    }).sort({ createdAt: 1 });

    // Populate details
    const notesWithDetails = await Promise.all(pendingNotes.map(async (note) => {
      const sender = await Participant.findById(note.sender);
      const recipient = await Participant.findById(note.recipient);
      const lockedBy = note.lockedBy ? await Participant.findById(note.lockedBy) : null;
      
      return {
        ...note.toObject(),
        sender: {
          _id: sender._id,
          username: sender.name,
          role: sender.role
        },
        recipient: {
          _id: recipient._id,
          username: recipient.name,
          role: recipient.role
        },
        lockedBy: lockedBy ? {
          _id: lockedBy._id,
          username: lockedBy.name,
          role: lockedBy.role
        } : null
      };
    }));

    res.json({
      success: true,
      notes: notesWithDetails
    });
  } catch (error) {
    console.error('[HIERARCHICAL-NOTE] Error loading pending notes:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading pending notes'
    });
  }
});

// Lock a note for moderation
router.post('/lock/:noteId', authenticateToken, async (req, res) => {
  console.log('[HIERARCHICAL-NOTE] POST /lock/:noteId - Request received');
  try {
    const { noteId } = req.params;
    const currentUser = req.user;

    const note = await HierarchicalNote.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check if note is already locked by someone else
    if (note.lockedBy && note.lockedBy.toString() !== currentUser._id.toString()) {
      return res.status(409).json({
        success: false,
        message: 'Note is already locked by another moderator'
      });
    }

    // Lock the note
    note.lockedBy = currentUser._id;
    note.lockedAt = new Date();
    await note.save();

    res.json({
      success: true,
      message: 'Note locked successfully'
    });
  } catch (error) {
    console.error('[HIERARCHICAL-NOTE] Error locking note:', error);
    res.status(500).json({
      success: false,
      message: 'Error locking note'
    });
  }
});

// Approve a note
router.post('/approve/:noteId', authenticateToken, async (req, res) => {
  console.log('[HIERARCHICAL-NOTE] POST /approve/:noteId - Request received');
  try {
    const { noteId } = req.params;
    const currentUser = req.user;

    const note = await HierarchicalNote.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check if note is locked by current user
    if (!note.lockedBy || note.lockedBy.toString() !== currentUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You must lock the note before approving it'
      });
    }

    // Approve the note
    note.status = 'approved';
    note.approvedAt = new Date();
    note.moderator = currentUser._id;
    await note.save();

    // Emit WebSocket event
    const io = req.app.get('io');
    io.to(`conference-${note.conference}`).emit('hierarchical-note-approved', {
      noteId,
      conferenceId: note.conference
    });

    res.json({
      success: true,
      message: 'Note approved successfully'
    });
  } catch (error) {
    console.error('[HIERARCHICAL-NOTE] Error approving note:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving note'
    });
  }
});

// Reject a note
router.post('/reject/:noteId', authenticateToken, async (req, res) => {
  console.log('[HIERARCHICAL-NOTE] POST /reject/:noteId - Request received');
  try {
    const { noteId } = req.params;
    const { reason } = req.body;
    const currentUser = req.user;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const note = await HierarchicalNote.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check if note is locked by current user
    if (!note.lockedBy || note.lockedBy.toString() !== currentUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You must lock the note before rejecting it'
      });
    }

    // Reject the note
    note.status = 'rejected';
    note.rejectedAt = new Date();
    note.moderator = currentUser._id;
    note.rejectionReason = reason;
    await note.save();

    // Emit WebSocket event
    const io = req.app.get('io');
    io.to(`conference-${note.conference}`).emit('hierarchical-note-rejected', {
      noteId,
      reason,
      conferenceId: note.conference
    });

    res.json({
      success: true,
      message: 'Note rejected successfully'
    });
  } catch (error) {
    console.error('[HIERARCHICAL-NOTE] Error rejecting note:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting note'
    });
  }
});

module.exports = router; 