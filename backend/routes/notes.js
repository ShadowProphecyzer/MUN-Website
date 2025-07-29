const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const User = require('../models/User');
const Conference = require('../models/Conference');
const { authenticateToken } = require('../middleware/auth');

// Get all participants in the same conference for chat list
router.get('/participants/:conferenceId', authenticateToken, async (req, res) => {
  console.log('[NOTE-API] GET /participants/:conferenceId - Request received');
  try {
    const { conferenceId } = req.params;
    const currentUser = req.user;
    console.log('[NOTE-API] Conference ID:', conferenceId);
    console.log('[NOTE-API] Current user:', currentUser.username, currentUser.role);

    // Verify conference exists
    console.log('[NOTE-API] Verifying conference exists');
    const conference = await Conference.findById(conferenceId);
    if (!conference) {
      console.log('[NOTE-API] Conference not found');
      return res.status(404).json({
        success: false,
        message: 'Conference not found'
      });
    }
    console.log('[NOTE-API] Conference found:', conference.name);

    // Get conference-specific database
    console.log('[NOTE-API] Getting conference database');
    const { getConferenceDb } = require('../services/getConferenceDb');
    const Participant = getConferenceDb(conference.code);

    // Get all participants in the same conference
    console.log('[NOTE-API] Fetching participants from conference database');
    const participants = await Participant.find({
      email: { $ne: currentUser.email } // Exclude current user by email
    }).select('name email role country');
    console.log('[NOTE-API] Participants found:', participants.length);

    // Map to expected format
    const mappedParticipants = participants.map(p => ({
      _id: p._id,
      username: p.name,
      role: p.role,
      email: p.email,
      country: p.country
    }));

    const responseData = {
      success: true,
      participants: mappedParticipants,
      conference: {
        id: conference._id,
        name: conference.name,
        code: conference.code,
        committeeName: conference.committeeName
      }
    };
    console.log('[NOTE-API] Sending response with', mappedParticipants.length, 'participants');
    res.json(responseData);
  } catch (error) {
    console.error('[NOTE-API] Error fetching participants:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching participants'
    });
  }
});

// Send a note
router.post('/send', authenticateToken, async (req, res) => {
  console.log('[NOTE-API] POST /send - Request received');
  try {
    const { recipientId, message, conferenceId } = req.body;
    const senderId = req.user._id;
    console.log('[NOTE-API] Request data:', { recipientId, message: message.substring(0, 50) + '...', conferenceId });
    console.log('[NOTE-API] Sender ID:', senderId);

    // Validate required fields
    if (!recipientId || !message || !conferenceId) {
      console.log('[NOTE-API] Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Recipient, message, and conference are required'
      });
    }

    // Check if recipient exists in conference database
    console.log('[NOTE-API] Checking if recipient exists');
    const { getConferenceDb } = require('../services/getConferenceDb');
    const Participant = getConferenceDb(conference.code);
    
    const recipient = await Participant.findById(recipientId);
    if (!recipient) {
      console.log('[NOTE-API] Recipient not found');
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }
    console.log('[NOTE-API] Recipient found:', recipient.name);

    // Check if conference exists
    console.log('[NOTE-API] Checking if conference exists');
    const conference = await Conference.findById(conferenceId);
    if (!conference) {
      console.log('[NOTE-API] Conference not found');
      return res.status(404).json({
        success: false,
        message: 'Conference not found'
      });
    }
    console.log('[NOTE-API] Conference found:', conference.name);

    // Find sender in conference database
    console.log('[NOTE-API] Finding sender in conference database');
    const senderParticipant = await Participant.findOne({ email: currentUser.email });
    if (!senderParticipant) {
      console.log('[NOTE-API] Sender not found in conference database');
      return res.status(404).json({
        success: false,
        message: 'Sender not found in conference'
      });
    }
    console.log('[NOTE-API] Sender found:', senderParticipant.name);

    // Create new note
    console.log('[NOTE-API] Creating new note');
    const note = new Note({
      sender: senderParticipant._id,
      recipient: recipientId,
      conference: conferenceId,
      message,
      status: 'sent'
    });

    await note.save();
    console.log('[NOTE-API] Note saved with ID:', note._id);

    // Manually construct sender and recipient details
    console.log('[NOTE-API] Constructing note details');
    const noteWithDetails = {
      ...note.toObject(),
      sender: {
        _id: senderParticipant._id,
        username: senderParticipant.name,
        role: senderParticipant.role
      },
      recipient: {
        _id: recipient._id,
        username: recipient.name,
        role: recipient.role
      }
    };

    // Emit WebSocket event for new note
    console.log('[NOTE-API] Emitting WebSocket event');
    const io = req.app.get('io');
    io.to(`conference-${conferenceId}`).emit('note-created', {
      note: noteWithDetails,
      conferenceId
    });

    console.log('[NOTE-API] Note sent successfully');
    res.json({
      success: true,
      message: 'Note sent successfully',
      note: noteWithDetails
    });
  } catch (error) {
    console.error('[NOTE-API] Error sending note:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending note'
    });
  }
});

// Get conversation history between two users
router.get('/conversation/:recipientId', authenticateToken, async (req, res) => {
  console.log('[NOTE-API] GET /conversation/:recipientId - Request received');
  try {
    const { recipientId } = req.params;
    const { conferenceId } = req.query;
    const currentUserId = req.user._id;
    console.log('[NOTE-API] Request params:', { recipientId, conferenceId, currentUserId });

    if (!conferenceId) {
      console.log('[NOTE-API] Conference ID missing');
      return res.status(400).json({
        success: false,
        message: 'Conference ID is required'
      });
    }

    console.log('[NOTE-API] Fetching conversation notes');
    const notes = await Note.find({
      conference: conferenceId,
      $or: [
        { sender: currentUserId, recipient: recipientId },
        { sender: recipientId, recipient: currentUserId }
      ]
    })
    .populate('sender', 'username role')
    .populate('recipient', 'username role')
    .populate('moderator', 'username role')
    .populate('conference', 'name code committeeName')
    .sort({ createdAt: 1 });

    console.log('[NOTE-API] Conversation notes found:', notes.length);
    res.json({
      success: true,
      notes
    });
  } catch (error) {
    console.error('[NOTE-API] Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversation'
    });
  }
});

// Get all pending notes for moderators
router.get('/pending', authenticateToken, async (req, res) => {
  console.log('[NOTE-API] GET /pending - Request received');
  try {
    const currentUser = req.user;
    const { conferenceId } = req.query;
    console.log('[NOTE-API] Current user:', currentUser.username, currentUser.role);
    console.log('[NOTE-API] Conference ID:', conferenceId);

    // Check if user is moderator or admin
    if (!['moderator', 'admin'].includes(currentUser.role)) {
      console.log('[NOTE-API] User not authorized for moderator panel');
      return res.status(403).json({
        success: false,
        message: 'Access denied. Moderator privileges required.'
      });
    }

    const query = { status: 'sent' };
    if (conferenceId) {
      query.conference = conferenceId;
    }
    console.log('[NOTE-API] Query for pending notes:', query);

    const pendingNotes = await Note.find(query)
    .populate('sender', 'username role')
    .populate('recipient', 'username role')
    .populate('conference', 'name code committeeName')
    .sort({ createdAt: 1 });

    console.log('[NOTE-API] Pending notes found:', pendingNotes.length);
    res.json({
      success: true,
      notes: pendingNotes
    });
  } catch (error) {
    console.error('[NOTE-API] Error fetching pending notes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending notes'
    });
  }
});

// Approve a note (moderator only)
router.patch('/approve/:noteId', authenticateToken, async (req, res) => {
  console.log('[NOTE-API] PATCH /approve/:noteId - Request received');
  try {
    const { noteId } = req.params;
    const currentUser = req.user;
    console.log('[NOTE-API] Note ID:', noteId);
    console.log('[NOTE-API] Current user:', currentUser.username, currentUser.role);

    // Check if user is moderator or admin
    if (!['moderator', 'admin'].includes(currentUser.role)) {
      console.log('[NOTE-API] User not authorized to approve notes');
      return res.status(403).json({
        success: false,
        message: 'Access denied. Moderator privileges required.'
      });
    }

    console.log('[NOTE-API] Finding note by ID');
    const note = await Note.findById(noteId);
    if (!note) {
      console.log('[NOTE-API] Note not found');
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }
    console.log('[NOTE-API] Note found, current status:', note.status);

    if (note.status !== 'sent') {
      console.log('[NOTE-API] Note already processed');
      return res.status(400).json({
        success: false,
        message: 'Note has already been processed'
      });
    }

    console.log('[NOTE-API] Approving note');
    note.status = 'approved';
    note.moderator = currentUser._id;
    note.approvedAt = new Date();
    await note.save();
    console.log('[NOTE-API] Note approved and saved');

    await note.populate('sender', 'username role');
    await note.populate('recipient', 'username role');
    await note.populate('moderator', 'username role');
    await note.populate('conference', 'name code committeeName');

    // Emit WebSocket event for approved note
    console.log('[NOTE-API] Emitting WebSocket event for approved note');
    const io = req.app.get('io');
    io.to(`conference-${note.conference._id}`).emit('note-approved', {
      note,
      conferenceId: note.conference._id
    });

    console.log('[NOTE-API] Note approved successfully');
    res.json({
      success: true,
      message: 'Note approved successfully',
      note
    });
  } catch (error) {
    console.error('[NOTE-API] Error approving note:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving note'
    });
  }
});

// Reject a note (moderator only)
router.patch('/reject/:noteId', authenticateToken, async (req, res) => {
  console.log('[NOTE-API] PATCH /reject/:noteId - Request received');
  try {
    const { noteId } = req.params;
    const { rejectionReason } = req.body;
    const currentUser = req.user;
    console.log('[NOTE-API] Note ID:', noteId);
    console.log('[NOTE-API] Rejection reason:', rejectionReason);
    console.log('[NOTE-API] Current user:', currentUser.username, currentUser.role);

    // Check if user is moderator or admin
    if (!['moderator', 'admin'].includes(currentUser.role)) {
      console.log('[NOTE-API] User not authorized to reject notes');
      return res.status(403).json({
        success: false,
        message: 'Access denied. Moderator privileges required.'
      });
    }

    if (!rejectionReason) {
      console.log('[NOTE-API] Rejection reason missing');
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    console.log('[NOTE-API] Finding note by ID');
    const note = await Note.findById(noteId);
    if (!note) {
      console.log('[NOTE-API] Note not found');
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }
    console.log('[NOTE-API] Note found, current status:', note.status);

    if (note.status !== 'sent') {
      console.log('[NOTE-API] Note already processed');
      return res.status(400).json({
        success: false,
        message: 'Note has already been processed'
      });
    }

    console.log('[NOTE-API] Rejecting note');
    note.status = 'rejected';
    note.moderator = currentUser._id;
    note.rejectionReason = rejectionReason;
    note.rejectedAt = new Date();
    await note.save();
    console.log('[NOTE-API] Note rejected and saved');

    await note.populate('sender', 'username role');
    await note.populate('recipient', 'username role');
    await note.populate('moderator', 'username role');
    await note.populate('conference', 'name code committeeName');

    // Emit WebSocket event for rejected note
    console.log('[NOTE-API] Emitting WebSocket event for rejected note');
    const io = req.app.get('io');
    io.to(`conference-${note.conference._id}`).emit('note-rejected', {
      note,
      conferenceId: note.conference._id
    });

    console.log('[NOTE-API] Note rejected successfully');
    res.json({
      success: true,
      message: 'Note rejected successfully',
      note
    });
  } catch (error) {
    console.error('[NOTE-API] Error rejecting note:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting note'
    });
  }
});

// Get user's sent and received notes
router.get('/my-notes', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const notes = await Note.find({
      $or: [
        { sender: currentUserId },
        { recipient: currentUserId }
      ]
    })
    .populate('sender', 'username role')
    .populate('recipient', 'username role')
    .populate('moderator', 'username role')
    .populate('conference', 'name code committeeName')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      notes
    });
  } catch (error) {
    console.error('Error fetching user notes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notes'
    });
  }
});

module.exports = router; 