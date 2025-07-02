const express = require('express');
const { getConferenceDb } = require('../services/getConferenceDb');
const ParticipantSchema = require('../models/Participant');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Helper to get Participant model for a conference
function getParticipantModel(code) {
  const db = getConferenceDb(code);
  return db.models.Participant || db.model('Participant', ParticipantSchema);
}

// Helper to get GOD email from config.env
function getGodEmail() {
  const envPath = path.join(__dirname, '../config.env');
  const env = fs.readFileSync(envPath, 'utf-8');
  const match = env.match(/GOD_EMAIL=(.+)/);
  return match ? match[1].trim() : null;
}

// GET /api/participants/:code
router.get('/:code', authenticateToken, async (req, res) => {
  console.log('[DEBUG] Entered /api/participants/:code endpoint');
  try {
    const code = req.params.code;
    console.log('[DEBUG] About to get Participant model for code:', code);
    const Participant = getParticipantModel(code);
    console.log('[DEBUG] Got Participant model:', !!Participant);
    console.log('[DEBUG] About to find all participants');
    const participants = await Participant.find();
    console.log('[DEBUG] Found participants:', participants.length);
    res.json({ success: true, data: participants });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// POST /api/participants/:code/add
router.post('/:code/add', authenticateToken, async (req, res) => {
  console.log('[DEBUG] Entered /api/participants/:code/add endpoint');
  try {
    const code = req.params.code;
    let { email, role, country } = req.body;
    console.log('[DEBUG] Request body:', req.body);
    if (!email) {
      console.log('[DEBUG] No email provided');
      return res.status(400).json({ success: false, message: 'Email required.' });
    }
    email = email.trim().toLowerCase();
    role = (role || 'unassigned').toLowerCase();
    // Check user exists in main users DB
    const user = await User.findOne({ email });
    console.log('[DEBUG] User found in main DB:', user);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    console.log('[DEBUG] About to get Participant model for code:', code);
    const Participant = getParticipantModel(code);
    console.log('[DEBUG] Got Participant model:', !!Participant);
    console.log('[DEBUG] About to check if already a participant');
    const already = await Participant.findOne({ email });
    console.log('[DEBUG] Already a participant:', already);
    if (already) return res.status(400).json({ success: false, message: 'Already a participant.' });
    console.log('[DEBUG] About to check current user permissions');
    const current = await Participant.findOne({ email: req.user.email.trim().toLowerCase() });
    console.log('[DEBUG] Current participant:', current);
    // Permission check: Only god, owner, or administrator can add participants
    if (!current || !['god', 'owner', 'administrator'].includes(current.role.toLowerCase())) {
      console.log('[DEBUG] No permission to add participant');
      return res.status(403).json({ success: false, message: 'No permission.' });
    }
    // Prevent assigning GOD or Owner roles
    if (['god','owner'].includes(role)) {
      console.log('[DEBUG] Attempt to assign GOD or Owner role');
      return res.status(400).json({ success: false, message: 'Cannot assign GOD or Owner roles.' });
    }
    // Prevent Administrators from assigning Administrator role
    if (current.role.toLowerCase() === 'administrator' && role === 'administrator') {
      console.log('[DEBUG] Administrator cannot assign Administrator role');
      return res.status(403).json({ success: false, message: 'Administrators cannot assign Administrator role.' });
    }
    // Add as selected role
    console.log('[DEBUG] About to create new participant');
    const participantData = { email, name: user.username, role };
    if (role === 'delegate' && country) participantData.country = country;
    
    // V2 Lock system: lock1 and lock2
    let lock1 = false, lock2 = false;
    if (role === 'god' || role === 'owner') { 
      lock1 = true; 
      lock2 = true; 
      console.log('[DEBUG] Setting lock1: true, lock2: true for role:', role);
    }
    else if (role === 'administrator') { 
      lock2 = true; 
      console.log('[DEBUG] Setting lock2: true for role:', role);
    }
    participantData.lock1 = lock1;
    participantData.lock2 = lock2;
    
    await Participant.create(participantData);
    console.log('[DEBUG] Created new participant');
    // Emit update
    req.app.get('io').to(`conference_${code}`).emit('participantsUpdate');
    res.json({ success: true });
  } catch (error) {
    console.error('[DEBUG] Add participant error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// POST /api/participants/:code/remove
router.post('/:code/remove', authenticateToken, async (req, res) => {
  console.log('[DEBUG] Entered /api/participants/:code/remove endpoint');
  try {
    const code = req.params.code;
    const { email } = req.body;
    console.log('[DEBUG] Remove request - code:', code, 'email:', email);
    if (!email) return res.status(400).json({ success: false, message: 'Email required.' });
    const Participant = getParticipantModel(code);
    const target = await Participant.findOne({ email: email.trim().toLowerCase() });
    console.log('[DEBUG] Target participant to remove:', target);
    if (!target) return res.status(404).json({ success: false, message: 'Not found.' });
    // Only god/owner/administrator can remove
    const current = await Participant.findOne({ email: req.user.email.trim().toLowerCase() });
    console.log('[DEBUG] Current user participant:', current);
    console.log('[DEBUG] Current role:', current?.role, 'Lowercase:', current?.role?.toLowerCase());
    console.log('[DEBUG] Checking if role is in:', ['god', 'owner', 'administrator']);
    if (!current || !['god', 'owner', 'administrator'].includes(current.role.toLowerCase())) {
      console.log('[DEBUG] Permission denied - role not allowed');
      return res.status(403).json({ success: false, message: 'No permission.' });
    }
    // V2 Lock system checks
    // No one can remove GOD/Owner (lock1)
    if (target.lock1) {
      console.log('[DEBUG] Cannot remove GOD/Owner (lock1)');
      return res.status(403).json({ success: false, message: 'Cannot remove GOD/Owner.' });
    }
    // Only GOD/Owner can remove Admins (lock2)
    if (target.lock2 && !['god', 'owner'].includes(current.role.toLowerCase())) {
      console.log('[DEBUG] Only GOD/Owner can remove Administrators (lock2)');
      return res.status(403).json({ success: false, message: 'Only GOD/Owner can remove Administrators.' });
    }
    console.log('[DEBUG] About to remove participant');
    await Participant.deleteOne({ email: target.email });
    console.log('[DEBUG] Participant removed successfully');
    req.app.get('io').to(`conference_${code}`).emit('participantsUpdate');
    res.json({ success: true });
  } catch (error) {
    console.error('[DEBUG] Remove participant error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// POST /api/participants/:code/role
router.post('/:code/role', authenticateToken, async (req, res) => {
  console.log('[DEBUG] Entered /api/participants/:code/role endpoint');
  try {
    const code = req.params.code;
    const { email, role } = req.body;
    console.log('[DEBUG] Role change request - code:', code, 'email:', email, 'new role:', role);
    if (!email || !role) return res.status(400).json({ success: false, message: 'Email and role required.' });
    const Participant = getParticipantModel(code);
    const target = await Participant.findOne({ email: email.trim().toLowerCase() });
    console.log('[DEBUG] Target participant for role change:', target);
    if (!target) return res.status(404).json({ success: false, message: 'Not found.' });
    // V2 Lock system: Cannot change GOD/Owner (lock1)
    if (target.lock1) return res.status(403).json({ success: false, message: 'Cannot change GOD/Owner.' });
    // Only god/owner/administrator can assign
    const current = await Participant.findOne({ email: req.user.email.trim().toLowerCase() });
    console.log('[DEBUG] Current user for role change:', current);
    console.log('[DEBUG] Current role:', current?.role, 'Lowercase:', current?.role?.toLowerCase());
    if (!current || !['god', 'owner', 'administrator'].includes(current.role.toLowerCase())) {
      console.log('[DEBUG] Permission denied for role change');
      return res.status(403).json({ success: false, message: 'No permission.' });
    }
    const newRole = role.toLowerCase();
    if (current.role.toLowerCase() === 'administrator' && (newRole === 'administrator' || ['god', 'owner', 'administrator'].includes(target.role.toLowerCase()))) {
      console.log('[DEBUG] Administrator cannot change this role');
      return res.status(403).json({ success: false, message: 'Cannot assign or change GOD/Owner/Admin.' });
    }
    console.log('[DEBUG] About to update role');
    const updateData = { role: newRole };
    
    // V2 Lock system: Update lock1/lock2 based on new role
    if (newRole === 'god' || newRole === 'owner') {
      updateData.lock1 = true;
      updateData.lock2 = true;
      console.log('[DEBUG] Setting lock1: true, lock2: true for role change to:', newRole);
    }
    else if (newRole === 'administrator') {
      updateData.lock1 = false;
      updateData.lock2 = true;
      console.log('[DEBUG] Setting lock1: false, lock2: true for role change to:', newRole);
    }
    else {
      updateData.lock1 = false;
      updateData.lock2 = false;
      console.log('[DEBUG] Setting lock1: false, lock2: false for role change to:', newRole);
    }
    
    await Participant.updateOne({ email: target.email }, { $set: updateData });
    console.log('[DEBUG] Role updated successfully');
    req.app.get('io').to(`conference_${code}`).emit('participantsUpdate');
    res.json({ success: true });
  } catch (error) {
    console.error('[DEBUG] Role change error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// POST /api/participants/:code/country
router.post('/:code/country', authenticateToken, async (req, res) => {
  console.log('[DEBUG] Entered /api/participants/:code/country endpoint');
  try {
    const code = req.params.code;
    const { email, country } = req.body;
    console.log('[DEBUG] Country assignment request - code:', code, 'email:', email, 'country:', country);
    if (!email || !country) return res.status(400).json({ success: false, message: 'Email and country required.' });
    const Participant = getParticipantModel(code);
    const target = await Participant.findOne({ email: email.trim().toLowerCase() });
    console.log('[DEBUG] Target participant for country assignment:', target);
    if (!target) return res.status(404).json({ success: false, message: 'Not found.' });
    if (target.role.toLowerCase() !== 'delegate') {
      console.log('[DEBUG] Only delegates can have countries, target role:', target.role);
      return res.status(400).json({ success: false, message: 'Only delegates can have a country.' });
    }
    // Only god/owner/administrator can assign
    const current = await Participant.findOne({ email: req.user.email.trim().toLowerCase() });
    console.log('[DEBUG] Current user for country assignment:', current);
    console.log('[DEBUG] Current role:', current?.role, 'Lowercase:', current?.role?.toLowerCase());
    if (!current || !['god', 'owner', 'administrator'].includes(current.role.toLowerCase())) {
      console.log('[DEBUG] Permission denied for country assignment');
      return res.status(403).json({ success: false, message: 'No permission.' });
    }
    console.log('[DEBUG] About to update country');
    await Participant.updateOne({ email: target.email }, { $set: { country } });
    console.log('[DEBUG] Country updated successfully');
    req.app.get('io').to(`conference_${code}`).emit('participantsUpdate');
    res.json({ success: true });
  } catch (error) {
    console.error('[DEBUG] Country assignment error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router; 