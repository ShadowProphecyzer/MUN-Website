const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createConference,
  joinConference,
  getConferenceSettings,
  updateConferenceSettings,
  setUserRole,
  getMyConferences,
  getConference,
  getConferenceParticipants,
  getAllConferences,
  sendWorldWideMessage
} = require('../controllers/conferenceController');

// Create conference (anyone can create)
router.post('/', protect, createConference);

// Join conference by code
router.post('/join', protect, joinConference);

// Send world-wide message (God only)
router.post('/world-wide-message', protect, sendWorldWideMessage);

// Get user's conferences (or all conferences if God)
router.get('/my', protect, getMyConferences);

// Get all conferences (God only)
router.get('/all', protect, getAllConferences);

// Get single conference
router.get('/:conferenceId', protect, getConference);

// Get conference participants
router.get('/:conferenceId/participants', protect, getConferenceParticipants);

// Get conference settings (owner, admins, and god only)
router.get('/:conferenceId/settings', protect, getConferenceSettings);

// Update conference settings (owner and god only)
router.put('/:conferenceId/settings', protect, updateConferenceSettings);

// Set user role in conference (owner and god only)
router.patch('/:conferenceId/role', protect, setUserRole);

module.exports = router;
