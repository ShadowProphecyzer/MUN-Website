// routes/amendmentsRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const { roleCheck } = require('../middleware/roleMiddleware');
const {
  getAmendments,
  submitAmendment,
  reviewAmendment,
} = require('../controllers/amendmentsController');

// GET /api/conferences/:conferenceId/amendments
// Any logged-in user can view amendments
router.get('/', protect, getAmendments);

// POST /api/conferences/:conferenceId/amendments
// Delegates submit new amendment
router.post('/', protect, roleCheck(['delegate']), submitAmendment);

// PATCH /api/conferences/:conferenceId/amendments/:amendmentId/review
// Chairs approve or decline amendment
router.patch('/:amendmentId/review', protect, roleCheck(['chair']), reviewAmendment);

module.exports = router;
