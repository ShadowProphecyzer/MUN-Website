const express = require('express');
const { getConferenceDb } = require('../services/getConferenceDb');
const ParticipantSchema = require('../models/Participant');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

function getParticipantModelV2(code) {
  const db = getConferenceDb(code);
  return db.models.Participant || db.model('Participant', ParticipantSchema);
}

// Add participant
router.post('/:code/add', authenticateToken, async (req, res) => {
  try {
    const code = req.params.code;
    let { email, role, country } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required.' });
    email = email.trim().toLowerCase();
    role = (role || 'unassigned').toLowerCase();
    // Check user exists in main users DB
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const Participant = getParticipantModelV2(code);
    const already = await Participant.findOne({ email });
    if (already) return res.status(400).json({ success: false, message: 'Already a participant.' });
    // Permission check: Only god, owner, or administrator can add
    const current = await Participant.findOne({ email: req.user.email.trim().toLowerCase() });
    if (!current || !['god', 'owner', 'administrator'].includes(current.role)) {
      return res.status(403).json({ success: false, message: 'No permission.' });
    }
    // Assign lock1/lock2
    let lock1 = false, lock2 = false;
    if (role === 'god' || role === 'owner') { lock1 = true; lock2 = true; }
    else if (role === 'administrator') { lock2 = true; }
    const participantData = {
      email,
      name: user.username,
      role,
      country,
      lock1,
      lock2
    };
    await Participant.create(participantData);
    req.app.get('io').to(`conference_${code}`).emit('participantsUpdate');

    // === AUTO-UPDATE CONTRIBUTIONS FOR DELEGATES ===
    try {
      const { getConferenceDb } = require('../services/getConferenceDb');
      const ContributionSchema = require('../models/Contribution');
      const db = getConferenceDb(code);
      const Contribution = db.models.Contribution || db.model('Contribution', ContributionSchema);
      const Participant = db.models.Participant || db.model('Participant', require('../models/Participant'));
      // Get all delegates with a country, sorted alphabetically
      const delegates = await Participant.find({ role: 'delegate', country: { $exists: true, $ne: '' } }).sort({ country: 1 });
      const countries = delegates.map(d => d.country);
      // Upsert contributions for each delegate country
      let updatedContributions = [];
      for (const delegate of delegates) {
        if (delegate.country) {
          const contribution = await Contribution.findOneAndUpdate(
            { conferenceCode: code, country: delegate.country },
            {},
            { new: true, upsert: true, setDefaultsOnInsert: true }
          );
          updatedContributions.push(contribution);
        }
      }
      // Remove contributions for countries no longer assigned
      await Contribution.deleteMany({ conferenceCode: code, country: { $nin: countries } });
      // Emit full updated list
      updatedContributions = await Contribution.find({ conferenceCode: code }).sort({ country: 1 });
      req.app.get('io').to(`conference_${code}`).emit('contributionUpdate', { conferenceCode: code, contributions: updatedContributions });
    } catch (contribError) {
      console.error('[DEBUG] Error auto-updating contributions:', contribError);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Remove participant
router.post('/:code/remove', authenticateToken, async (req, res) => {
  try {
    const code = req.params.code;
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required.' });
    const Participant = getParticipantModelV2(code);
    const target = await Participant.findOne({ email: email.trim().toLowerCase() });
    if (!target) return res.status(404).json({ success: false, message: 'Not found.' });
    const current = await Participant.findOne({ email: req.user.email.trim().toLowerCase() });
    if (!current || !['god', 'owner', 'administrator'].includes(current.role)) {
      return res.status(403).json({ success: false, message: 'No permission.' });
    }
    // No one can remove GOD/Owner
    if (target.lock1) {
      return res.status(403).json({ success: false, message: 'Cannot remove GOD/Owner.' });
    }
    // Only GOD/Owner can remove Admins
    if (target.lock2 && !['god', 'owner'].includes(current.role)) {
      return res.status(403).json({ success: false, message: 'Only GOD/Owner can remove Administrators.' });
    }
    await Participant.deleteOne({ email: target.email });
    req.app.get('io').to(`conference_${code}`).emit('participantsUpdate');

    // === AUTO-UPDATE CONTRIBUTIONS FOR DELEGATES ===
    try {
      const { getConferenceDb } = require('../services/getConferenceDb');
      const ContributionSchema = require('../models/Contribution');
      const db = getConferenceDb(code);
      const Contribution = db.models.Contribution || db.model('Contribution', ContributionSchema);
      const Participant = db.models.Participant || db.model('Participant', require('../models/Participant'));
      // Get all delegates with a country, sorted alphabetically
      const delegates = await Participant.find({ role: 'delegate', country: { $exists: true, $ne: '' } }).sort({ country: 1 });
      const countries = delegates.map(d => d.country);
      // Upsert contributions for each delegate country
      let updatedContributions = [];
      for (const delegate of delegates) {
        if (delegate.country) {
          const contribution = await Contribution.findOneAndUpdate(
            { conferenceCode: code, country: delegate.country },
            {},
            { new: true, upsert: true, setDefaultsOnInsert: true }
          );
          updatedContributions.push(contribution);
        }
      }
      // Remove contributions for countries no longer assigned
      await Contribution.deleteMany({ conferenceCode: code, country: { $nin: countries } });
      // Emit full updated list
      updatedContributions = await Contribution.find({ conferenceCode: code }).sort({ country: 1 });
      req.app.get('io').to(`conference_${code}`).emit('contributionUpdate', { conferenceCode: code, contributions: updatedContributions });
    } catch (contribError) {
      console.error('[DEBUG] Error auto-updating contributions:', contribError);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router; 