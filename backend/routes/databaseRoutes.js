// routes/databaseRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const { canManageUsers } = require('../middleware/roleMiddleware');
const {
  getConferenceData,
  downloadConferenceDataPDF,
} = require('../controllers/databaseController');

// Get all conference data (only owners and admins)
router.get('/data', protect, canManageUsers, getConferenceData);

// Download conference data as PDF (only owners and admins)
router.get('/data/pdf', protect, canManageUsers, downloadConferenceDataPDF);

module.exports = router;
