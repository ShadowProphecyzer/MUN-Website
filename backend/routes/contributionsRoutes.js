// routes/contributionsRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const { roleCheck } = require('../middleware/roleMiddleware');
const {
  getContributions,
  updateContribution,
  setAwardWinners,
} = require('../controllers/contributionsController');

// GET /api/conferences/:conferenceId/contributions
// Chairs get contributions
router.get('/', protect, roleCheck(['chair']), getContributions);

// PATCH /api/conferences/:conferenceId/contributions/update
// Chairs update contributions counts
router.patch('/update', protect, roleCheck(['chair']), updateContribution);

// POST /api/conferences/:conferenceId/contributions/awards
// Chairs set award winners
router.post('/awards', protect, roleCheck(['chair']), setAwardWinners);

module.exports = router;
