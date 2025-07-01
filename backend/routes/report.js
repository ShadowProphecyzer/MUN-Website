const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const reportService = require('../services/reportService');
const path = require('path');

const typeToFunc = {
  people: reportService.generatePeopleReport,
  // amendments: reportService.generateAmendmentsReport,
  // chat: reportService.generateChatReport,
  // voting: reportService.generateVotingReport,
  // contributions: reportService.generateContributionsReport,
  // awards: reportService.generateAwardsReport
};

router.post('/:conferenceCode/report/:type', authenticateToken, requireRole(['God','Owner','Admin']), async (req, res) => {
  const { conferenceCode, type } = req.params;
  const user = req.user;
  if (!typeToFunc[type]) return res.status(400).json({ error: 'Invalid report type' });
  try {
    const file = await typeToFunc[type](conferenceCode, user);
    const filename = path.basename(file);
    res.json({ file, download: `/conferences/${conferenceCode}/reports/${filename}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router; 