// controllers/peopleController.js
const UserConferenceRole = require('../models/UserConferenceRole');
const User = require('../models/User');

// Get all people in a conference with their roles and country
exports.getPeopleByConference = async (req, res) => {
  const { conferenceId } = req.params;

  try {
    const people = await UserConferenceRole.find({ conference: conferenceId })
      .populate('user', 'username email')
      .exec();

    res.json(people);
  } catch (error) {
    console.error('Get people error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add or update user role in conference
exports.addOrUpdateUserRole = async (req, res) => {
  const { conferenceId } = req.params;
  const { userId, role, country } = req.body;

  if (!['owner', 'editor', 'moderator', 'chair', 'delegate'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    // Check user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Upsert the role for this user and conference
    const updated = await UserConferenceRole.findOneAndUpdate(
      { user: userId, conference: conferenceId },
      { role, country: role === 'delegate' ? country : '' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(updated);
  } catch (error) {
    console.error('Add/update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove a user from conference
exports.removeUserFromConference = async (req, res) => {
  const { conferenceId, userId } = req.params;

  try {
    await UserConferenceRole.findOneAndDelete({ user: userId, conference: conferenceId });
    res.json({ message: 'User removed from conference' });
  } catch (error) {
    console.error('Remove user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
