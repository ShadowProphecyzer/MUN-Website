// routes/contributionsRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const { isOwnerOrChair } = require('../middleware/roleMiddleware');
const {
  getContributions,
  updateContribution,
  setAwardWinners,
} = require('../controllers/contributionsController');

// Get all contributions (owners and chairs only)
router.get('/', protect, isOwnerOrChair, getContributions);

// Update contribution counts (owners and chairs only)
router.patch('/update', protect, isOwnerOrChair, updateContribution);

// Set award winners (owners and chairs only)
router.post('/awards', protect, isOwnerOrChair, setAwardWinners);

module.exports = router;
