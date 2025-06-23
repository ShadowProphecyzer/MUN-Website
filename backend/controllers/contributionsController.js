// controllers/contributionsController.js
const Contribution = require('../models/Contribution');
const UserConferenceRole = require('../models/UserConferenceRole');

// Get all contributions for a conference (chairs only)
exports.getContributions = async (req, res) => {
  const { conferenceId } = req.params;

  try {
    const contributions = await Contribution.find({ conference: conferenceId })
      .populate('userRole', 'country role')
      .exec();

    res.json(contributions);
  } catch (error) {
    console.error('Get contributions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update contribution counts (chairs only)
exports.updateContribution = async (req, res) => {
  const { conferenceId } = req.params;
  const { userRoleId, type, delta } = req.body; 
  // type is one of 'speeches', 'points', 'amendments', 'strikes'
  // delta is +1 or -1

  if (!['speeches', 'points', 'amendments', 'strikes'].includes(type)) {
    return res.status(400).json({ message: 'Invalid contribution type' });
  }

  if (![1, -1].includes(delta)) {
    return res.status(400).json({ message: 'Invalid delta value' });
  }

  try {
    const contribution = await Contribution.findOne({ conference: conferenceId, userRole: userRoleId });

    if (!contribution) {
      return res.status(404).json({ message: 'Contribution record not found' });
    }

    const newValue = contribution[type] + delta;

    if (newValue < 0) {
      return res.status(400).json({ message: 'Contribution count cannot be negative' });
    }

    contribution[type] = newValue;
    await contribution.save();

    res.json(contribution);
  } catch (error) {
    console.error('Update contribution error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Set award winners (best delegate, honorary mention, best position paper) (chairs only)
const ConferenceAward = require('../models/ConferenceAward');

exports.setAwardWinners = async (req, res) => {
  const { conferenceId } = req.params;
  const { bestDelegateUserRoleId, honoraryMentionUserRoleId, bestPositionPaperUserRoleId } = req.body;

  try {
    let award = await ConferenceAward.findOne({ conference: conferenceId });
    if (!award) {
      award = new ConferenceAward({ conference: conferenceId });
    }

    award.bestDelegate = bestDelegateUserRoleId || null;
    award.honoraryMention = honoraryMentionUserRoleId || null;
    award.bestPositionPaper = bestPositionPaperUserRoleId || null;

    await award.save();

    res.json(award);
  } catch (error) {
    console.error('Set awards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
