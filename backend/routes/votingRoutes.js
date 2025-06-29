// routes/votingRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const { isOwnerOrChair, isDelegate } = require('../middleware/roleMiddleware');
const {
  openVoting,
  closeVoting,
  castVote,
  getVoteResults,
} = require('../controllers/votingController');

// Open voting (owners and chairs only)
router.post('/open', protect, isOwnerOrChair, openVoting);

// Close voting (owners and chairs only)
router.post('/close', protect, isOwnerOrChair, closeVoting);

// Cast vote (delegates only)
router.post('/cast', protect, isDelegate, castVote);

// Get vote results (owners and chairs only)
router.get('/results', protect, isOwnerOrChair, getVoteResults);

module.exports = router;
