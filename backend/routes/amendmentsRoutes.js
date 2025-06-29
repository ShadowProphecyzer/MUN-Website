// routes/amendmentsRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const { isOwnerOrChair } = require('../middleware/roleMiddleware');
const {
  getAmendments,
  submitAmendment,
  reviewAmendment,
} = require('../controllers/amendmentsController');

// Get all amendments (all authenticated users)
router.get('/', protect, getAmendments);

// Submit amendment (owners, admins, and delegates can submit)
router.post('/', protect, submitAmendment);

// Review amendment (owners and chairs only)
router.patch('/:amendmentId/review', protect, isOwnerOrChair, reviewAmendment);

module.exports = router;
