const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const Conference = require('../models/Conference');
const { authenticateToken } = require('../middleware/auth');
const { conferenceValidation, validateRequest } = require('../middleware/validation');
const rateLimiterMiddleware = require('../middleware/rateLimiter');
const User = require('../models/User');

// POST /api/conference/create - Create a new conference
router.post('/create', 
  authenticateToken,
  rateLimiterMiddleware,
  conferenceValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { conferenceName, committeeName, committeeIssue } = req.body;
      
      // Generate unique conference code
      const conferenceCode = await Conference.generateUniqueCode();
      
      // Create folder path
      const conferencesDir = path.join(__dirname, '../../conferences');
      const folderName = `${conferenceCode} - ${conferenceName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').substring(0, 50)}`;
      const folderPath = path.join(conferencesDir, folderName);
      
      // Verify conferences directory exists, create if not
      try {
        await fs.access(conferencesDir);
      } catch (error) {
        // Directory doesn't exist, create it
        await fs.mkdir(conferencesDir, { recursive: true });
        console.log('✅ Created conferences directory');
      }
      
      // Create conference folder
      await fs.mkdir(folderPath, { recursive: true });
      console.log(`✅ Created conference folder: ${folderName}`);
      
      // Add God and Owner to people array
      const godEmail = process.env.GOD_EMAIL;
      const godUser = await User.findOne({ email: godEmail });
      if (!godUser) throw new Error('God user not found in users database');
      const ownerUser = await User.findById(req.user._id);
      if (!ownerUser) throw new Error('Owner user not found in users database');
      const people = [
        {
          email: godUser.email,
          userId: godUser._id,
          role: 'god',
          country: '',
        },
        {
          email: ownerUser.email,
          userId: ownerUser._id,
          role: 'owner',
          country: '',
        }
      ];
      
      // Create new conference in database
      const conference = new Conference({
        conferenceName,
        committeeName,
        committeeIssue,
        conferenceCode,
        creator: {
          userId: req.user._id,
          username: req.user.username
        },
        folderPath: folderPath,
        people
      });
      
      await conference.save();
      
      console.log(`✅ Conference created successfully: ${conferenceCode}`);
      
      res.status(201).json({
        success: true,
        message: 'Conference created successfully',
        data: {
          conference: {
            id: conference._id,
            conferenceName: conference.conferenceName,
            committeeName: conference.committeeName,
            committeeIssue: conference.committeeIssue,
            conferenceCode: conference.conferenceCode,
            creator: conference.creator,
            status: conference.status,
            createdAt: conference.createdAt
          }
        }
      });
      
    } catch (error) {
      console.error('Conference creation error:', error);
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        let message = 'Duplicate field error';
        
        if (field === 'committeeName') {
          message = 'Committee name already exists';
        } else if (field === 'conferenceCode') {
          message = 'Conference code already exists. Please try again.';
        }
        
        return res.status(409).json({
          success: false,
          message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Conference creation failed. Please try again.'
      });
    }
  }
);

// GET /api/conference/:code - Get conference by code
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const conference = await Conference.findOne({ conferenceCode: code });
    
    if (!conference) {
      return res.status(404).json({
        success: false,
        message: 'Conference not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Conference retrieved successfully',
      data: {
        conference: {
          id: conference._id,
          conferenceName: conference.conferenceName,
          committeeName: conference.committeeName,
          committeeIssue: conference.committeeIssue,
          conferenceCode: conference.conferenceCode,
          creator: conference.creator,
          status: conference.status,
          createdAt: conference.createdAt,
          updatedAt: conference.updatedAt
        }
      }
    });
    
  } catch (error) {
    console.error('Conference retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve conference'
    });
  }
});

// GET /api/conference/user/:userId - Get conferences created by user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only access their own conferences
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const conferences = await Conference.find({ 'creator.userId': userId })
      .sort({ createdAt: -1 })
      .select('-folderPath');
    
    res.status(200).json({
      success: true,
      message: 'User conferences retrieved successfully',
      data: {
        conferences: conferences.map(conf => ({
          id: conf._id,
          conferenceName: conf.conferenceName,
          committeeName: conf.committeeName,
          committeeIssue: conf.committeeIssue,
          conferenceCode: conf.conferenceCode,
          creator: conf.creator,
          status: conf.status,
          createdAt: conf.createdAt,
          updatedAt: conf.updatedAt
        }))
      }
    });
    
  } catch (error) {
    console.error('User conferences retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user conferences'
    });
  }
});

// GET /api/conference/check-name/:committeeName - Check if committee name is available
router.get('/check-name/:committeeName', async (req, res) => {
  try {
    const { committeeName } = req.params;
    
    const isTaken = await Conference.isCommitteeNameTaken(committeeName);
    
    res.status(200).json({
      success: true,
      data: {
        committeeName,
        isAvailable: !isTaken
      }
    });
    
  } catch (error) {
    console.error('Committee name check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check committee name'
    });
  }
});

// Helper: Get role of user in conference
async function getUserRole(conference, userId) {
  const person = conference.people.find(p => p.userId.toString() === userId.toString());
  return person ? person.role : null;
}

// Helper: Emit people update via Socket.IO
function emitPeopleUpdate(conferenceCode, people, req) {
  if (req.app && req.app.get('io')) {
    req.app.get('io').to(`conference_${conferenceCode}`).emit('peopleUpdate', people);
  }
}

// GET /api/conference/:code/people - Get people list (role-based)
router.get('/:code/people', authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;
    const conference = await Conference.findOne({ conferenceCode: code });
    if (!conference) return res.status(404).json({ success: false, message: 'Conference not found' });
    const role = await getUserRole(conference, req.user._id);
    if (!role) return res.status(403).json({ success: false, message: 'Access denied' });
    // All roles can view the list
    res.json({ success: true, data: { people: conference.people } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get people list' });
  }
});

// POST /api/conference/:code/people - Add user to conference
router.post('/:code/people', authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;
    const { email, role, country } = req.body;
    const conference = await Conference.findOne({ conferenceCode: code });
    if (!conference) return res.status(404).json({ success: false, message: 'Conference not found' });
    const actingRole = await getUserRole(conference, req.user._id);
    if (!['god', 'owner', 'admin'].includes(actingRole)) return res.status(403).json({ success: false, message: 'Access denied' });
    if (role === 'admin' && !['god', 'owner'].includes(actingRole)) return res.status(403).json({ success: false, message: 'Only God/Owner can assign admin role' });
    // Check if user exists
    const User = require('../models/User');
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found in users database' });
    // Check if already in people
    if (conference.people.some(p => p.userId.toString() === user._id.toString())) return res.status(409).json({ success: false, message: 'User already in conference' });
    // Add to people
    conference.people.push({ email: user.email, userId: user._id, role, country: country || '' });
    await conference.save();
    emitPeopleUpdate(conference.conferenceCode, conference.people, req);
    res.json({ success: true, message: 'User added', data: { people: conference.people } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add user' });
  }
});

// PATCH /api/conference/:code/people/:userId - Edit role/country
router.patch('/:code/people/:userId', authenticateToken, async (req, res) => {
  try {
    const { code, userId } = req.params;
    const { role, country } = req.body;
    const conference = await Conference.findOne({ conferenceCode: code });
    if (!conference) return res.status(404).json({ success: false, message: 'Conference not found' });
    const actingRole = await getUserRole(conference, req.user._id);
    const targetPerson = conference.people.find(p => p.userId.toString() === userId);
    if (!targetPerson) return res.status(404).json({ success: false, message: 'User not found in conference' });
    // God/Owner can edit anyone except God/Owner; Admins can only edit delegates/chairs/moderators
    if (['god', 'owner'].includes(targetPerson.role) && !['god', 'owner'].includes(actingRole)) return res.status(403).json({ success: false, message: 'Cannot edit God/Owner' });
    if (role === 'admin' && !['god', 'owner'].includes(actingRole)) return res.status(403).json({ success: false, message: 'Only God/Owner can assign admin role' });
    if (['admin', 'owner', 'god'].includes(targetPerson.role) && actingRole === 'admin') return res.status(403).json({ success: false, message: 'Admins cannot edit admins/owners/god' });
    // Update role/country
    if (role) targetPerson.role = role;
    if (country !== undefined) targetPerson.country = country;
    targetPerson.updatedAt = new Date();
    await conference.save();
    emitPeopleUpdate(conference.conferenceCode, conference.people, req);
    res.json({ success: true, message: 'User updated', data: { people: conference.people } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// DELETE /api/conference/:code/people/:userId - Remove user
router.delete('/:code/people/:userId', authenticateToken, async (req, res) => {
  try {
    const { code, userId } = req.params;
    const conference = await Conference.findOne({ conferenceCode: code });
    if (!conference) return res.status(404).json({ success: false, message: 'Conference not found' });
    const actingRole = await getUserRole(conference, req.user._id);
    const targetPerson = conference.people.find(p => p.userId.toString() === userId);
    if (!targetPerson) return res.status(404).json({ success: false, message: 'User not found in conference' });
    // Cannot remove God/Owner
    if (['god', 'owner'].includes(targetPerson.role)) return res.status(403).json({ success: false, message: 'Cannot remove God/Owner' });
    // Only God/Owner can remove admins
    if (targetPerson.role === 'admin' && !['god', 'owner'].includes(actingRole)) return res.status(403).json({ success: false, message: 'Only God/Owner can remove admins' });
    // Admins can remove delegates/chairs/moderators
    if (['delegate', 'chair', 'moderator'].includes(targetPerson.role) && !['god', 'owner', 'admin'].includes(actingRole)) return res.status(403).json({ success: false, message: 'Access denied' });
    // Remove user
    conference.people = conference.people.filter(p => p.userId.toString() !== userId);
    await conference.save();
    emitPeopleUpdate(conference.conferenceCode, conference.people, req);
    res.json({ success: true, message: 'User removed', data: { people: conference.people } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove user' });
  }
});

module.exports = router; 