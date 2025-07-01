const express = require('express');
const router = express.Router();
const { getContributions, updateContribution, resetContributions, getOrCreateAwards, setAward } = require('../services/contributionDb');
const { authenticateToken, requireRole } = require('../middleware/auth');

module.exports = (io) => {
  // List contributions
  router.get('/:conferenceCode/contributions', authenticateToken, requireRole(['God','Owner','Admin','Chair']), async (req, res) => {
    const { conferenceCode } = req.params;
    const data = await getContributions(conferenceCode);
    res.json({ contributions: data });
  });

  // Update a contribution field
  router.post('/:conferenceCode/contributions/:delegateId', authenticateToken, requireRole(['God','Owner','Admin','Chair']), async (req, res) => {
    const { conferenceCode, delegateId } = req.params;
    const { field, delta } = req.body;
    if (!['pois','amendments','speeches','strikes'].includes(field)) {
      return res.status(400).json({ error: 'Invalid field' });
    }
    if (![1,-1].includes(delta)) {
      return res.status(400).json({ error: 'Invalid delta' });
    }
    const doc = await updateContribution(conferenceCode, delegateId, field, delta);
    if (doc) {
      io.to(`conference_${conferenceCode}`).emit('contributionUpdated', { delegateId, field, value: doc[field] });
      res.json({ contribution: doc });
    } else {
      res.status(404).json({ error: 'Delegate not found' });
    }
  });

  // Reset all contributions
  router.post('/:conferenceCode/contributions/reset', authenticateToken, requireRole(['God','Owner','Admin','Chair']), async (req, res) => {
    const { conferenceCode } = req.params;
    const data = await resetContributions(conferenceCode);
    io.to(`conference_${conferenceCode}`).emit('contributionsReset', {});
    res.json({ contributions: data });
  });

  // Get awards
  router.get('/:conferenceCode/awards', authenticateToken, requireRole(['God','Owner','Admin','Chair']), async (req, res) => {
    const { conferenceCode } = req.params;
    const data = await getOrCreateAwards(conferenceCode);
    res.json({ awards: data });
  });

  // Set award
  router.post('/:conferenceCode/awards', authenticateToken, requireRole(['God','Owner','Admin','Chair']), async (req, res) => {
    const { conferenceCode } = req.params;
    const { field, country } = req.body;
    if (!['bestDelegate','honourableMention','bestPositionPaper'].includes(field)) {
      return res.status(400).json({ error: 'Invalid award field' });
    }
    const data = await setAward(conferenceCode, field, country);
    io.to(`conference_${conferenceCode}`).emit('awardsUpdated', { field, country });
    res.json({ awards: data });
  });

  return router;
}; 