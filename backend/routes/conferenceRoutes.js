const express = require('express');
const router = express.Router();
const conferenceController = require('../controllers/conferenceController');
const auth = require('../middleware/authMiddleware');

// Protected routes (user must be logged in)
router.post('/create', auth, conferenceController.createConference);
router.post('/join', auth, conferenceController.joinConference);

module.exports = router;
