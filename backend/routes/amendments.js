const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getConferenceDb } = require('../services/getConferenceDb');
const AmendmentSchema = require('../models/Amendment').schema;
const ParticipantSchema = require('../models/Participant');

// Allowed roles for adding amendments
const ALLOWED_ROLES = ['god', 'owner', 'administrator', 'delegate'];

// Allowed roles for approving/updating amendment status
const APPROVAL_ROLES = ['god', 'owner', 'administrator', 'chair'];

// Helper: Get Amendment model for a conference
function getAmendmentModel(code) {
  const db = getConferenceDb(code);
  return db.models.Amendment || db.model('Amendment', AmendmentSchema);
}
// Helper: Get Participant model for a conference
function getParticipantModel(code) {
  const db = getConferenceDb(code);
  return db.models.Participant || db.model('Participant', ParticipantSchema);
}
// Helper: Get next amendmentId for a conference
async function getNextAmendmentId(conferenceCode) {
  const Amendment = getAmendmentModel(conferenceCode);
  const last = await Amendment.find().sort({ amendmentId: -1 }).limit(1);
  return last.length > 0 ? last[0].amendmentId + 1 : 1;
}

// POST /api/amendments/:conferenceCode - Add new amendment
router.post('/:conferenceCode', requireAuth, async (req, res) => {
  try {
    console.log('[DEBUG] Entered POST /api/amendments/:conferenceCode');
    const { conferenceCode } = req.params;
    const { number, letter, roman, actionType, content, friendly } = req.body;
    console.log('[DEBUG] Params:', conferenceCode);
    console.log('[DEBUG] Body:', req.body);
    console.log('[DEBUG] User:', req.user);
    if (
      typeof number !== 'number' ||
      typeof letter !== 'string' || letter.length !== 1 ||
      typeof roman !== 'string' || !roman.match(/^[IVXLCDM]+$/i) ||
      typeof actionType !== 'string' || !['add', 'modify', 'strike'].includes(actionType) ||
      typeof content !== 'string' || content.length < 1 ||
      typeof friendly !== 'boolean'
    ) {
      console.log('[DEBUG] Validation failed:', { 
        number, 
        letter, 
        roman, 
        actionType, 
        content, 
        friendly,
        numberType: typeof number,
        letterType: typeof letter,
        romanType: typeof roman,
        actionTypeType: typeof actionType,
        contentType: typeof content,
        friendlyType: typeof friendly,
        letterLength: letter ? letter.length : 'undefined',
        contentLength: content ? content.length : 'undefined',
        actionTypeValid: actionType ? ['add', 'modify', 'strike'].includes(actionType) : false
      });
      return res.status(400).json({ success: false, message: 'Invalid input.' });
    }
    // Get user info from req.user (set by requireAuth)
    const user = req.user;
    console.log('[DEBUG] Looking up participant...');
    const Participant = getParticipantModel(conferenceCode);
    const participant = await Participant.findOne({ email: user.email });
    console.log('[DEBUG] Found participant:', participant);
    if (!participant || !ALLOWED_ROLES.includes(participant.role.toLowerCase())) {
      console.log('[DEBUG] Not allowed to add amendments:', participant);
      return res.status(403).json({ success: false, message: 'Not allowed to add amendments.' });
    }
    console.log('[DEBUG] Getting next amendmentId...');
    const amendmentId = await getNextAmendmentId(conferenceCode);
    console.log('[DEBUG] Next amendmentId:', amendmentId);
    // Create amendment
    const Amendment = getAmendmentModel(conferenceCode);
    const amendment = new Amendment({
      conferenceCode,
      amendmentId,
      user: {
        email: user.email,
        username: user.username || user.fullName || 'User',
        role: participant.role,
        country: participant.country || '',
      },
      number,
      letter,
      roman,
      actionType,
      content,
      friendly,
      status: 'on_hold', // Default status
    });
    console.log('[DEBUG] Saving amendment:', amendment);
    await amendment.save();
    console.log('[DEBUG] Amendment saved successfully');
    
    // Emit WebSocket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`conference_${conferenceCode}`).emit('amendmentUpdate', {
        type: 'created',
        amendment: amendment
      });
    }
    
    res.json({ success: true, data: amendment });
  } catch (err) {
    console.error('[ERROR] POST /api/amendments:', err, err.stack);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// PATCH /api/amendments/:conferenceCode/:amendmentId/status - Update amendment status
router.patch('/:conferenceCode/:amendmentId/status', requireAuth, async (req, res) => {
  try {
    const { conferenceCode, amendmentId } = req.params;
    const { status } = req.body;
    
    console.log('[DEBUG] PATCH amendment status:', { conferenceCode, amendmentId, status });
    
    // Validate status
    const validStatuses = ['passed', 'rejected', 'debating', 'on_hold'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    
    // Get user info
    const user = req.user;
    const Participant = getParticipantModel(conferenceCode);
    const participant = await Participant.findOne({ email: user.email });
    
    if (!participant || !APPROVAL_ROLES.includes(participant.role.toLowerCase())) {
      return res.status(403).json({ success: false, message: 'Not allowed to update amendment status.' });
    }
    
    // Update amendment status
    const Amendment = getAmendmentModel(conferenceCode);
    const amendment = await Amendment.findOneAndUpdate(
      { conferenceCode, amendmentId: parseInt(amendmentId) },
      { status },
      { new: true }
    );
    
    if (!amendment) {
      return res.status(404).json({ success: false, message: 'Amendment not found.' });
    }
    
    // Emit WebSocket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`conference_${conferenceCode}`).emit('amendmentUpdate', {
        type: 'statusUpdated',
        amendment: amendment
      });
    }
    
    res.json({ success: true, data: amendment });
  } catch (err) {
    console.error('[ERROR] PATCH amendment status:', err, err.stack);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/amendments/:conferenceCode - Get all amendments for a conference
router.get('/:conferenceCode', requireAuth, async (req, res) => {
  try {
    const { conferenceCode } = req.params;
    const user = req.user;
    console.log('[DEBUG] GET /api/amendments:', { conferenceCode, user });
    const Participant = getParticipantModel(conferenceCode);
    const participant = await Participant.findOne({ email: user.email });
    if (!participant) {
      console.log('[DEBUG] Not allowed to view amendments:', participant);
      return res.status(403).json({ success: false, message: 'Not allowed to view amendments.' });
    }
    const Amendment = getAmendmentModel(conferenceCode);
    const amendments = await Amendment.find().sort({ amendmentId: 1 });
    res.json({ success: true, data: amendments });
  } catch (err) {
    console.error('[ERROR] GET /api/amendments:', err, err.stack);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router; 