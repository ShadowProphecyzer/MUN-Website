const Conference = require('../models/Conference');
const User = require('../models/User');
const { nanoid } = require('nanoid'); // For unique code generation

// Helper function to check if user is God
const isGod = async (email) => {
  const godEmail = process.env.GOD_EMAIL;
  return godEmail && email === godEmail;
};

// Create new conference (anyone can create, becomes owner)
exports.createConference = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user._id; // from auth middleware

    // Generate unique 6-char conference code (alphanumeric)
    let code;
    do {
      code = nanoid(6).toUpperCase();
    } while(await Conference.findOne({ code }));

    // Create conference doc
    const conference = new Conference({
      name,
      code,
      owner: userId,
      settings: {
        description: description || ''
      }
    });

    await conference.save();

    res.status(201).json({ 
      message: 'Conference created successfully',
      conference 
    });
  } catch (err) {
    console.error('Create conference error:', err);
    res.status(500).json({ message: 'Server error creating conference' });
  }
};

// Join existing conference by code
exports.joinConference = async (req, res) => {
  try {
    const { code, role, country } = req.body;
    const userId = req.user._id;

    const conference = await Conference.findOne({ code: code.toUpperCase() });
    if (!conference) {
      return res.status(404).json({ message: 'Conference not found' });
    }

    // Check if user already participant
    const alreadyJoined = conference.participants.some(p => p.user.toString() === userId.toString());
    if (alreadyJoined) {
      return res.status(400).json({ message: 'User already in conference' });
    }

    // Add user with role and country if delegate
    conference.participants.push({
      user: userId,
      role: role || 'delegate',
      country: role === 'delegate' ? country : undefined,
    });

    await conference.save();

    res.status(200).json({ message: 'Joined conference', conference });
  } catch (err) {
    console.error('Join conference error:', err);
    res.status(500).json({ message: 'Server error joining conference' });
  }
};

// Get conference settings (owner, admins, and god only)
exports.getConferenceSettings = async (req, res) => {
  try {
    const { conferenceId } = req.params;
    const userId = req.user._id;
    const userEmail = req.user.email;

    const conference = await Conference.findById(conferenceId);
    if (!conference) {
      return res.status(404).json({ message: 'Conference not found' });
    }

    // Check if user is God
    const userIsGod = await isGod(userEmail);
    
    // Check if user is owner, admin, or god
    const participant = conference.participants.find(p => p.user.toString() === userId.toString());
    if (!participant || (!userIsGod && !['owner', 'admin'].includes(participant.role))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      settings: conference.settings,
      participants: conference.participants
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update conference settings (owner and god only)
exports.updateConferenceSettings = async (req, res) => {
  try {
    const { conferenceId } = req.params;
    const userId = req.user._id;
    const userEmail = req.user.email;
    const { settings } = req.body;

    const conference = await Conference.findById(conferenceId);
    if (!conference) {
      return res.status(404).json({ message: 'Conference not found' });
    }

    // Check if user is God
    const userIsGod = await isGod(userEmail);
    
    // Check if user is owner or god
    const participant = conference.participants.find(p => p.user.toString() === userId.toString());
    if (!participant || (!userIsGod && participant.role !== 'owner')) {
      return res.status(403).json({ message: 'Only owner or god can update settings' });
    }

    // Update settings
    if (settings) {
      conference.settings = { ...conference.settings, ...settings };
    }

    await conference.save();

    res.json({ message: 'Settings updated', settings: conference.settings });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Set user role in conference (owner and god only)
exports.setUserRole = async (req, res) => {
  try {
    const { conferenceId } = req.params;
    const { userId, role } = req.body;
    const currentUserId = req.user._id;
    const currentUserEmail = req.user.email;

    const conference = await Conference.findById(conferenceId);
    if (!conference) {
      return res.status(404).json({ message: 'Conference not found' });
    }

    // Check if current user is God
    const userIsGod = await isGod(currentUserEmail);
    
    // Check if current user is owner or god
    const currentParticipant = conference.participants.find(p => p.user.toString() === currentUserId.toString());
    if (!currentParticipant || (!userIsGod && currentParticipant.role !== 'owner')) {
      return res.status(403).json({ message: 'Only owner or god can set roles' });
    }

    // Find and update user role
    const participant = conference.participants.find(p => p.user.toString() === userId);
    if (!participant) {
      return res.status(404).json({ message: 'User not found in conference' });
    }

    // Prevent changing God's role
    const targetUser = await User.findById(userId);
    if (targetUser && await isGod(targetUser.email)) {
      return res.status(403).json({ message: 'Cannot change God\'s role' });
    }

    participant.role = role;
    await conference.save();

    res.json({ message: 'Role updated successfully', participant });
  } catch (error) {
    console.error('Set user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user's conferences (or all conferences if God)
exports.getMyConferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email;

    // Check if user is God
    const userIsGod = await isGod(userEmail);
    
    let conferences;
    if (userIsGod) {
      // God can see all conferences
      conferences = await Conference.find({})
        .populate('owner', 'username')
        .populate('participants.user', 'username email');
    } else {
      // Regular users see only their conferences
      conferences = await Conference.find({
        'participants.user': userId
      }).populate('owner', 'username');
    }

    res.json(conferences);
  } catch (error) {
    console.error('Get my conferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all conferences (God only) - for dropdown/search
exports.getAllConferences = async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Check if user is God
    const userIsGod = await isGod(userEmail);
    if (!userIsGod) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const conferences = await Conference.find({})
      .populate('owner', 'username')
      .populate('participants.user', 'username email')
      .select('name code createdAt participants');

    res.json(conferences);
  } catch (error) {
    console.error('Get all conferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get conference participants (for settings page)
exports.getConferenceParticipants = async (req, res) => {
  try {
    const { conferenceId } = req.params;
    const userId = req.user._id;

    const conference = await Conference.findById(conferenceId)
      .populate('participants.user', 'username email')
      .populate('owner', 'username');

    if (!conference) {
      return res.status(404).json({ message: 'Conference not found' });
    }

    // Check if user is participant
    const participant = conference.participants.find(p => p.user._id.toString() === userId.toString());
    if (!participant) {
      return res.status(403).json({ message: 'Not a participant in this conference' });
    }

    res.json(conference.participants);
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single conference by ID
exports.getConference = async (req, res) => {
  try {
    const { conferenceId } = req.params;
    const userId = req.user._id;

    const conference = await Conference.findById(conferenceId)
      .populate('owner', 'username');

    if (!conference) {
      return res.status(404).json({ message: 'Conference not found' });
    }

    // Check if user is participant
    const participant = conference.participants.find(p => p.user.toString() === userId.toString());
    if (!participant) {
      return res.status(403).json({ message: 'Not a participant in this conference' });
    }

    res.json(conference);
  } catch (error) {
    console.error('Get conference error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send world-wide message (God only)
exports.sendWorldWideMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const userEmail = req.user.email;

    // Check if user is God
    const userIsGod = await isGod(userEmail);
    if (!userIsGod) {
      return res.status(403).json({ message: 'Only God can send world-wide messages' });
    }

    // Validate message
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    if (message.length > 500) {
      return res.status(400).json({ message: 'Message too long (max 500 characters)' });
    }

    // Emit the message to all connected clients via Socket.IO
    // This will be handled by the socket server
    const io = req.app.get('io');
    if (io) {
      io.emit('worldWideMessage', {
        message: message.trim(),
        timestamp: new Date().toISOString()
      });
    }

    res.json({ 
      message: 'World-wide message sent successfully',
      sentAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Send world-wide message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
