// controllers/votingController.js
const Vote = require('../models/Vote');
const UserConferenceRole = require('../models/UserConferenceRole');

// Open voting (chairs only)
exports.openVoting = async (req, res) => {
  const { conferenceId } = req.params;

  try {
    let vote = await Vote.findOne({ conference: conferenceId });
    if (!vote) {
      vote = new Vote({ conference: conferenceId });
    }

    vote.votingOpen = true;
    vote.openedAt = new Date();
    vote.closedAt = null;
    vote.votes = []; // clear old votes

    await vote.save();

    res.json({ message: 'Voting opened', vote });
  } catch (error) {
    console.error('Open voting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Close voting (chairs only)
exports.closeVoting = async (req, res) => {
  const { conferenceId } = req.params;

  try {
    const vote = await Vote.findOne({ conference: conferenceId });
    if (!vote || !vote.votingOpen) {
      return res.status(400).json({ message: 'Voting is not currently open' });
    }

    vote.votingOpen = false;
    vote.closedAt = new Date();
    // Votes remain until cleared next time voting opens

    await vote.save();

    res.json({ message: 'Voting closed', vote });
  } catch (error) {
    console.error('Close voting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delegate casts vote
exports.castVote = async (req, res) => {
  const { conferenceId } = req.params;
  const userId = req.user._id;
  const { choice } = req.body;

  if (!['yes', 'no', 'abstain'].includes(choice)) {
    return res.status(400).json({ message: 'Invalid vote choice' });
  }

  try {
    const vote = await Vote.findOne({ conference: conferenceId });

    if (!vote || !vote.votingOpen) {
      return res.status(403).json({ message: 'Voting is not open' });
    }

    // Find UserConferenceRole for this user in this conference
    const userRole = await UserConferenceRole.findOne({ user: userId, conference: conferenceId });

    if (!userRole || userRole.role !== 'delegate') {
      return res.status(403).json({ message: 'Only delegates can vote' });
    }

    // Check if user already voted
    const existingVoteIndex = vote.votes.findIndex(v => v.voter.toString() === userRole._id.toString());

    if (existingVoteIndex >= 0) {
      // Update existing vote
      vote.votes[existingVoteIndex].choice = choice;
      vote.votes[existingVoteIndex].votedAt = new Date();
    } else {
      // Add new vote
      vote.votes.push({ voter: userRole._id, choice });
    }

    await vote.save();

    res.json({ message: 'Vote recorded', vote });
  } catch (error) {
    console.error('Cast vote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Chairs see live tally
exports.getVoteResults = async (req, res) => {
  const { conferenceId } = req.params;

  try {
    const vote = await Vote.findOne({ conference: conferenceId });

    if (!vote || !vote.votingOpen) {
      return res.status(400).json({ message: 'Voting is not currently open' });
    }

    const tally = { yes: 0, no: 0, abstain: 0 };
    vote.votes.forEach(v => {
      if (tally[v.choice] !== undefined) {
        tally[v.choice]++;
      }
    });

    res.json({ tally });
  } catch (error) {
    console.error('Get vote results error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
