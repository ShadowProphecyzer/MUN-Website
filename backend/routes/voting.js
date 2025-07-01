const express = require('express');
const router = express.Router();
const { getCurrentSession, openSession, closeSession, castVote, getResults, getAllSessions } = require('../services/votingDb');
const { authenticateToken, requireRole } = require('../middleware/auth');

module.exports = (io, getDelegateIds) => {
  // Get current voting session
  router.get('/:conferenceCode/voting/current', authenticateToken, async (req, res) => {
    const { conferenceCode } = req.params;
    const session = await getCurrentSession(conferenceCode);
    res.json({ session });
  });

  // Open voting session
  router.post('/:conferenceCode/voting/open', authenticateToken, requireRole(['God','Owner','Admin','Chair']), async (req, res) => {
    const { conferenceCode } = req.params;
    const user = req.user;
    const session = await openSession(conferenceCode, user.username);
    io.to(`conference_${conferenceCode}`).emit('votingOpened', session);
    res.json({ session });
  });

  // Close voting session
  router.post('/:conferenceCode/voting/close', authenticateToken, requireRole(['God','Owner','Admin','Chair']), async (req, res) => {
    const { conferenceCode } = req.params;
    const user = req.user;
    const delegateIds = await getDelegateIds(conferenceCode);
    const session = await closeSession(conferenceCode, user.username, delegateIds);
    io.to(`conference_${conferenceCode}`).emit('votingClosed', session);
    res.json({ session });
  });

  // Cast or change vote (Delegate only)
  router.post('/:conferenceCode/voting/vote', authenticateToken, requireRole(['Delegate']), async (req, res) => {
    const { conferenceCode } = req.params;
    const user = req.user;
    const { vote } = req.body;
    if (!['for','against','abstain'].includes(vote)) {
      return res.status(400).json({ error: 'Invalid vote' });
    }
    const session = await castVote(conferenceCode, user._id, vote);
    io.to(`conference_${conferenceCode}`).emit('voteUpdated', { userId: user._id });
    res.json({ session });
  });

  // Get results (authorized roles only)
  router.get('/:conferenceCode/voting/results', authenticateToken, requireRole(['God','Owner','Admin','Chair']), async (req, res) => {
    const { conferenceCode } = req.params;
    const results = await getResults(conferenceCode);
    res.json({ results });
  });

  // Get voting history (authorized roles only)
  router.get('/:conferenceCode/voting/history', authenticateToken, requireRole(['God','Owner','Admin','Chair']), async (req, res) => {
    const { conferenceCode } = req.params;
    const sessions = await getAllSessions(conferenceCode);
    res.json({ sessions });
  });

  return router;
}; 