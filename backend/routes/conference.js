const express = require('express');
const fs = require('fs');
const path = require('path');
const Conference = require('../models/Conference');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Helper to generate a unique 12-digit code (first digit not 0)
async function generateUniqueCode() {
  let code;
  let exists = true;
  while (exists) {
    code = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    exists = await Conference.exists({ code });
  }
  return code;
}

// POST /api/conference/create
router.post('/create', authenticateToken, async (req, res) => {
  console.log('[DEBUG] Entered /api/conference/create endpoint');
  try {
    const { name, committeeName, committeeIssue } = req.body;
    console.log('[DEBUG] Conference creation request - name:', name, 'committeeName:', committeeName, 'committeeIssue:', committeeIssue);
    if (!name || !committeeName || !committeeIssue) {
      console.log('[DEBUG] Missing required fields');
      return res.status(400).json({ success: false, message: 'Name, committeeName, and committeeIssue are required.' });
    }
    console.log('[DEBUG] About to generate unique code');
    const code = await generateUniqueCode();
    console.log('[DEBUG] Generated code:', code);
    
    // Create folder for the conference
    const conferencesDir = path.join(__dirname, '../../conferences');
    console.log('[DEBUG] Conferences directory:', conferencesDir);
    if (!fs.existsSync(conferencesDir)) {
      console.log('[DEBUG] Creating conferences directory');
      fs.mkdirSync(conferencesDir);
    }
    const confFolder = path.join(conferencesDir, code);
    console.log('[DEBUG] Conference folder:', confFolder);
    if (!fs.existsSync(confFolder)) {
      console.log('[DEBUG] Creating conference folder');
      fs.mkdirSync(confFolder);
    }
    // Create .env file if missing
    const confEnvPath = path.join(confFolder, '.env');
    console.log('[DEBUG] Conference env path:', confEnvPath);
    if (!fs.existsSync(confEnvPath)) {
      console.log('[DEBUG] Creating conference .env file');
      const envContent = `MONGODB_URI=mongodb://localhost:27017/conference_${code}\n`;
      fs.writeFileSync(confEnvPath, envContent);
    }
    // Save to DB
    console.log('[DEBUG] About to save conference to main DB');
    const conference = await Conference.create({
      code,
      name,
      committeeName,
      committeeIssue,
      createdBy: req.user.id
    });
    console.log('[DEBUG] Conference saved to main DB:', conference);
    
    // Add GOD and Owner to participants list robustly
    console.log('[DEBUG] About to set up conference database and participants');
    const { getConferenceDb } = require('../services/getConferenceDb');
    const ParticipantSchema = require('../models/Participant');
    const db = getConferenceDb(code);
    const Participant = db.models.Participant || db.model('Participant', ParticipantSchema);
    
    // GOD
    console.log('[DEBUG] About to add GOD to participants');
    const configEnvPath = path.join(__dirname, '../config.env');
    const env = fs.readFileSync(configEnvPath, 'utf-8');
    const godMatch = env.match(/GOD_EMAIL=(.+)/);
    const godEmail = godMatch ? godMatch[1].trim().toLowerCase() : null;
    console.log('[DEBUG] GOD email from config:', godEmail);
    if (godEmail) {
      try {
        await Participant.updateOne(
          { email: godEmail },
          { $set: { name: 'GOD', role: 'GOD', isLocked: true } },
          { upsert: true }
        );
        console.log(`[DEBUG] Upserted GOD to participants: ${godEmail}`);
      } catch (err) {
        console.error('[DEBUG] Error upserting GOD:', err);
      }
    }
    
    // Owner
    console.log('[DEBUG] About to add Owner to participants');
    const ownerUser = await require('../models/User').findById(req.user.id);
    console.log('[DEBUG] Owner user found:', ownerUser);
    if (ownerUser) {
      try {
        await Participant.updateOne(
          { email: ownerUser.email.trim().toLowerCase() },
          { $set: { name: ownerUser.username, role: 'Owner', isLocked: true } },
          { upsert: true }
        );
        console.log(`[DEBUG] Upserted Owner to participants: ${ownerUser.email.trim().toLowerCase()}`);
      } catch (err) {
        console.error('[DEBUG] Error upserting Owner:', err);
      }
    }
    
    // Log all participants for this conference
    try {
      const allParticipants = await Participant.find();
      console.log('[DEBUG] All participants after creation:', allParticipants);
    } catch (err) {
      console.error('[DEBUG] Error fetching all participants:', err);
    }
    
    console.log('[DEBUG] Conference creation completed successfully');
    res.json({
      success: true,
      data: {
        code: conference.code,
        name: conference.name,
        committeeName: conference.committeeName,
        committeeIssue: conference.committeeIssue,
        createdBy: conference.createdBy,
        createdAt: conference.createdAt
      }
    });
  } catch (error) {
    console.error('[DEBUG] Conference creation error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// POST /api/conference/validate-code
router.post('/validate-code', authenticateToken, async (req, res) => {
  console.log('[DEBUG] Entered /api/conference/validate-code endpoint');
  try {
    const { code } = req.body;
    console.log('[DEBUG] Code validation request - code:', code);
    
    if (!code) {
      console.log('[DEBUG] No code provided');
      return res.status(400).json({ success: false, message: 'Conference code is required.' });
    }
    
    // Validate code format (12 digits)
    if (!/^\d{12}$/.test(code)) {
      console.log('[DEBUG] Invalid code format');
      return res.status(400).json({ success: false, message: 'Invalid conference code format. Code must be 12 digits.' });
    }
    
    // Check if conference exists
    const conference = await Conference.findOne({ code });
    if (!conference) {
      console.log('[DEBUG] Conference not found');
      return res.status(404).json({ success: false, message: 'Conference not found.' });
    }
    
    // Check if user is a participant in this conference
    const { getConferenceDb } = require('../services/getConferenceDb');
    const ParticipantSchema = require('../models/Participant');
    const db = getConferenceDb(code);
    const Participant = db.models.Participant || db.model('Participant', ParticipantSchema);
    
    const userEmail = req.user.email.trim().toLowerCase();
    const participant = await Participant.findOne({ email: userEmail });
    
    if (!participant) {
      console.log('[DEBUG] User not a participant in this conference');
      return res.status(403).json({ 
        success: false, 
        message: 'You are not in this conference or committee. Please consult an administrator or the owner.' 
      });
    }
    
    console.log('[DEBUG] Code validation successful');
    res.json({
      success: true,
      data: {
        code: conference.code,
        name: conference.name,
        committeeName: conference.committeeName,
        participantRole: participant.role
      }
    });
    
  } catch (error) {
    console.error('[DEBUG] Code validation error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// GET /api/conference/:code
router.get('/:code', authenticateToken, async (req, res) => {
  console.log('[DEBUG] Entered /api/conference/:code endpoint');
  try {
    const code = req.params.code;
    console.log('[DEBUG] Fetching conference details for code:', code);
    
    if (!code) {
      console.log('[DEBUG] No code provided');
      return res.status(400).json({ success: false, message: 'Conference code is required.' });
    }
    
    // Validate code format (12 digits)
    if (!/^\d{12}$/.test(code)) {
      console.log('[DEBUG] Invalid code format');
      return res.status(400).json({ success: false, message: 'Invalid conference code format.' });
    }
    
    // Check if conference exists
    const conference = await Conference.findOne({ code });
    if (!conference) {
      console.log('[DEBUG] Conference not found');
      return res.status(404).json({ success: false, message: 'Conference not found.' });
    }
    
    // Check if user is a participant in this conference
    const { getConferenceDb } = require('../services/getConferenceDb');
    const ParticipantSchema = require('../models/Participant');
    const db = getConferenceDb(code);
    const Participant = db.models.Participant || db.model('Participant', ParticipantSchema);
    
    const userEmail = req.user.email.trim().toLowerCase();
    const participant = await Participant.findOne({ email: userEmail });
    
    if (!participant) {
      console.log('[DEBUG] User not a participant in this conference');
      return res.status(403).json({ 
        success: false, 
        message: 'You are not a participant in this conference.' 
      });
    }
    
    console.log('[DEBUG] Conference details fetched successfully');
    res.json({
      success: true,
      data: {
        code: conference.code,
        name: conference.name,
        committeeName: conference.committeeName,
        committeeIssue: conference.committeeIssue,
        participantRole: participant.role,
        createdAt: conference.createdAt
      }
    });
    
  } catch (error) {
    console.error('[DEBUG] Fetch conference error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router; 