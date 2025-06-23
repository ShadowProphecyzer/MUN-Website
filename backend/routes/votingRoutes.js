// routes/votingRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const { roleCheck } = require('../middleware/roleMiddleware');
const {
  openVoting,
  closeVoting,
  castVote,
  getVoteResults,
} = require('../controllers/votingController');

// POST /api/conferences/:conferenceId/voting/open
// Chairs open voting
router.post('/open', protect, roleCheck(['chair']), openVoting);

// POST /api/conferences/:conferenceId/voting/close
// Chairs close voting
router.post('/close', protect, roleCheck(['chair']), closeVoting);

// POST /api/conferences/:conferenceId/voting/cast
// Delegates cast vote
router.post('/cast', protect, roleCheck(['delegate']), castVote);

// GET /api/conferences/:conferenceId/voting/results
// Chairs see live tally
router.get('/results', protect, roleCheck(['chair']), getVoteResults);

module.exports = router;
