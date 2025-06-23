const Conference = require('../models/Conference');
const User = require('../models/User');
const { nanoid } = require('nanoid'); // For unique code generation

// Create new conference (owner becomes current user)
exports.createConference = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id; // from auth middleware

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
      participants: [{ user: userId, role: 1 }] // Owner role
    });

    await conference.save();

    res.status(201).json({ conference });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating conference' });
  }
};

// Join existing conference by code
exports.joinConference = async (req, res) => {
  try {
    const { code, role, country } = req.body; // role = 4 for delegate, 2/3 etc. otherwise
    const userId = req.user.id;

    const conference = await Conference.findOne({ code: code.toUpperCase() });
    if (!conference) {
      return res.status(404).json({ message: 'Conference not found' });
    }

    // Check if user already participant
    const alreadyJoined = conference.participants.some(p => p.user.toString() === userId);
    if (alreadyJoined) {
      return res.status(400).json({ message: 'User already in conference' });
    }

    // Add user with role and country if delegate
    conference.participants.push({
      user: userId,
      role,
      country: role === 4 ? country : undefined,
    });

    await conference.save();

    res.status(200).json({ message: 'Joined conference', conference });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error joining conference' });
  }
};
