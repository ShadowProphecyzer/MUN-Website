const express = require('express');
const UserCommittee = require('../models/UserCommittee');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Conference = require('../models/Conference');
const { getConferenceDb } = require('../services/getConferenceDb');
const ParticipantSchema = require('../models/Participant');
const router = express.Router();

// Helper to get Participant model for a conference
function getParticipantModel(code) {
  const db = getConferenceDb(code);
  return db.models.Participant || db.model('Participant', ParticipantSchema);
}

// GET /api/user-committees - Get all committees for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userCommittees = await UserCommittee.find({ 
      userId: req.user._id, 
      isActive: true 
    }).sort({ dateAdded: -1 });
    
    res.json({ 
      success: true, 
      data: userCommittees 
    });
  } catch (error) {
    console.error('Error fetching user committees:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error.' 
    });
  }
});

// POST /api/user-committees/add - Add user to a committee (called when participant is added)
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { conferenceCode, email, role, country } = req.body;
    
    if (!conferenceCode || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Conference code and email required.' 
      });
    }

    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found.' 
      });
    }

    // Find the conference
    const conference = await Conference.findOne({ code: conferenceCode });
    if (!conference) {
      return res.status(404).json({ 
        success: false, 
        message: 'Conference not found.' 
      });
    }

    // Check if user is already in this committee
    const existingMembership = await UserCommittee.findOne({
      userId: user._id,
      conferenceCode: conferenceCode
    });

    if (existingMembership) {
      // Update existing membership
      existingMembership.role = role;
      existingMembership.country = country;
      existingMembership.isActive = true;
      await existingMembership.save();
    } else {
      // Create new membership
      await UserCommittee.create({
        userId: user._id,
        conferenceCode: conferenceCode,
        conferenceName: conference.name,
        committeeName: conference.committeeName,
        role: role,
        country: country
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error adding user to committee:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error.' 
    });
  }
});

// POST /api/user-committees/remove - Remove user from a committee (called when participant is removed)
router.post('/remove', authenticateToken, async (req, res) => {
  try {
    const { conferenceCode, email } = req.body;
    
    if (!conferenceCode || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Conference code and email required.' 
      });
    }

    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found.' 
      });
    }

    // Mark membership as inactive (soft delete)
    await UserCommittee.findOneAndUpdate(
      { 
        userId: user._id, 
        conferenceCode: conferenceCode 
      },
      { isActive: false }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing user from committee:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error.' 
    });
  }
});

// POST /api/user-committees/update-role - Update user's role in a committee
router.post('/update-role', authenticateToken, async (req, res) => {
  try {
    const { conferenceCode, email, role, country } = req.body;
    
    if (!conferenceCode || !email || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Conference code, email, and role required.' 
      });
    }

    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found.' 
      });
    }

    // Update the membership
    await UserCommittee.findOneAndUpdate(
      { 
        userId: user._id, 
        conferenceCode: conferenceCode 
      },
      { 
        role: role,
        country: country
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user role in committee:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error.' 
    });
  }
});

module.exports = router; 