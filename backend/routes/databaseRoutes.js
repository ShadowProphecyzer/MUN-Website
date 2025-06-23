// routes/databaseRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const { roleCheck } = require('../middleware/roleMiddleware');
const {
  getConferenceData,
  downloadConferenceDataPDF,
} = require('../controllers/databaseController');

// GET /api/conferences/:conferenceId/data
// Owners and editors get all conference data JSON
router.get('/data', protect, roleCheck(['owner', 'editor']), getConferenceData);

// GET /api/conferences/:conferenceId/data/pdf
// Owners and editors download conference data as PDF
router.get('/data/pdf', protect, roleCheck(['owner', 'editor']), downloadConferenceDataPDF);

module.exports = router;
