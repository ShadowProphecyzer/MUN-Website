// controllers/amendmentsController.js
const Amendment = require('../models/Amendment');
const UserConferenceRole = require('../models/UserConferenceRole');

// Get all amendments for a conference
exports.getAmendments = async (req, res) => {
  const { conferenceId } = req.params;

  try {
    const amendments = await Amendment.find({ conference: conferenceId })
      .populate('submitter', 'country role')
      .sort('createdAt');
    res.json(amendments);
  } catch (error) {
    console.error('Get amendments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit a new amendment (owners, admins, and delegates can submit)
exports.submitAmendment = async (req, res) => {
  const { conferenceId } = req.params;
  const userId = req.user._id;
  const { number, letter, romanNumeral, friendly, content } = req.body;

  try {
    const userRole = await UserConferenceRole.findOne({ user: userId, conference: conferenceId });
    if (!userRole) {
      return res.status(403).json({ message: 'User not found in conference' });
    }

    // Allow owners, admins, and delegates to submit amendments
    const allowedRoles = ['owner', 'admin', 'delegate'];
    if (!allowedRoles.includes(userRole.role)) {
      return res.status(403).json({ message: 'Only owners, admins, and delegates can submit amendments' });
    }

    // Check if number/letter/roman numeral combination already exists in this conference
    const exists = await Amendment.findOne({
      conference: conferenceId,
      number,
      letter,
      romanNumeral,
    });

    if (exists) {
      return res.status(400).json({ message: 'Amendment identifier already exists' });
    }

    const amendment = new Amendment({
      conference: conferenceId,
      submitter: userRole._id,
      number,
      letter,
      romanNumeral,
      friendly,
      content,
      approved: 'pending',
    });

    await amendment.save();

    res.status(201).json(amendment);
  } catch (error) {
    console.error('Submit amendment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Chairs approve or decline amendment
exports.reviewAmendment = async (req, res) => {
  const { amendmentId } = req.params;
  const { action } = req.body; // 'approve' or 'decline'

  try {
    if (!['approve', 'decline'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const amendment = await Amendment.findById(amendmentId);
    if (!amendment) return res.status(404).json({ message: 'Amendment not found' });

    amendment.approved = action === 'approve' ? 'approved' : 'declined';

    await amendment.save();

    res.json(amendment);
  } catch (error) {
    console.error('Review amendment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
