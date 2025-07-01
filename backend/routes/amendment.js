const express = require('express');
const router = express.Router();
const { getAmendments, createAmendment, updateAmendmentStatus } = require('../services/amendmentDb');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateAmendmentInput, validateStatusInput } = require('../middleware/validation');

module.exports = (io) => {
  // List all amendments
  router.get('/:conferenceCode/amendments', authenticateToken, async (req, res) => {
    const { conferenceCode } = req.params;
    try {
      const amendments = await getAmendments(conferenceCode);
      res.json({ amendments });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch amendments' });
    }
  });

  // Create amendment
  router.post('/:conferenceCode/amendments', authenticateToken, requireRole(['God','Owner','Admin','Delegate']), validateAmendmentInput, async (req, res) => {
    const { conferenceCode } = req.params;
    const user = req.user;
    const { resolutionNumber, clauseNumber, subclause, subSubClause, type, content } = req.body;
    try {
      const amendment = await createAmendment(conferenceCode, {
        resolutionNumber,
        clauseNumber,
        subclause,
        subSubClause,
        type,
        content,
        country: user.country,
        submitterRole: user.role !== 'Delegate' ? user.role : '',
      });
      io.to(`conference_${conferenceCode}`).emit('newAmendment', amendment);
      res.json({ amendment });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create amendment' });
    }
  });

  // Change status (Chair only)
  router.post('/:conferenceCode/amendments/:id/status', authenticateToken, requireRole(['Chair']), validateStatusInput, async (req, res) => {
    const { conferenceCode, id } = req.params;
    const { status } = req.body;
    const user = req.user;
    try {
      const amendment = await updateAmendmentStatus(conferenceCode, id, status, user.username);
      io.to(`conference_${conferenceCode}`).emit('amendmentStatusChanged', amendment);
      res.json({ amendment });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update status' });
    }
  });

  return router;
}; 