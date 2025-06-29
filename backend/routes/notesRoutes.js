// routes/notesRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const { canModerateMessages } = require('../middleware/roleMiddleware');
const {
  sendMessage,
  getPendingMessages,
  reviewMessage,
  getChatMessages,
  getMessageHistory,
} = require('../controllers/notesController');

// POST /api/conferences/:conferenceId/notes/send
// Any logged-in user sends a message to another user
router.post('/send', protect, sendMessage);

// GET /api/conferences/:conferenceId/notes/pending
// Moderators get pending messages to approve/reject
router.get('/pending', protect, canModerateMessages, getPendingMessages);

// PATCH /api/conferences/:conferenceId/notes/:noteId/review
// Moderators approve or reject message
router.patch('/:noteId/review', protect, canModerateMessages, reviewMessage);

// GET /api/conferences/:conferenceId/notes/chat?otherUserId=xxx
// Get approved chat messages between logged in user and another user
router.get('/chat', protect, getChatMessages);

// Get message history for audit (only moderators, admins, and owners)
router.get('/history', protect, canModerateMessages, getMessageHistory);

module.exports = router;
