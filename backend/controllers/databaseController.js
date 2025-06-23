// controllers/databaseController.js
const Conference = require('../models/Conference');
const UserConferenceRole = require('../models/UserConferenceRole');
const Amendment = require('../models/Amendment');
const Contribution = require('../models/Contribution');
const Vote = require('../models/Vote');
const Message = require('../models/Message');
const PDFDocument = require('pdfkit'); // For PDF generation

// Get all data related to a conference
exports.getConferenceData = async (req, res) => {
  const { conferenceId } = req.params;

  try {
    // Fetch all related data
    const conference = await Conference.findById(conferenceId);
    if (!conference) return res.status(404).json({ message: 'Conference not found' });

    const users = await UserConferenceRole.find({ conference: conferenceId }).populate('user', 'username email');
    const amendments = await Amendment.find({ conference: conferenceId }).populate('submitter', 'country');
    const contributions = await Contribution.find({ conference: conferenceId }).populate('userRole', 'country');
    const vote = await Vote.findOne({ conference: conferenceId });
    const messages = await Message.find({ conference: conferenceId });

    res.json({
      conference,
      users,
      amendments,
      contributions,
      vote,
      messages,
    });
  } catch (error) {
    console.error('Get conference data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate and send a PDF download of conference data
exports.downloadConferenceDataPDF = async (req, res) => {
  const { conferenceId } = req.params;

  try {
    const conference = await Conference.findById(conferenceId);
    if (!conference) return res.status(404).json({ message: 'Conference not found' });

    const users = await UserConferenceRole.find({ conference: conferenceId }).populate('user', 'username email');
    const amendments = await Amendment.find({ conference: conferenceId }).populate('submitter', 'country');
    const contributions = await Contribution.find({ conference: conferenceId }).populate('userRole', 'country');
    const vote = await Vote.findOne({ conference: conferenceId });
    const messages = await Message.find({ conference: conferenceId });

    // Setup PDF document
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="conference_${conferenceId}_data.pdf"`);

    doc.pipe(res);

    doc.fontSize(20).text(`Conference Data Export: ${conference.name}`, { underline: true });
    doc.moveDown();

    // Users
    doc.fontSize(16).text('Users:');
    users.forEach(u => {
      doc.fontSize(12).text(`- ${u.user.username} (${u.user.email}), Role: ${u.role}, Country: ${u.country || 'N/A'}`);
    });
    doc.moveDown();

    // Amendments
    doc.fontSize(16).text('Amendments:');
    amendments.forEach(a => {
      doc.fontSize(12).text(
        `- #${a.number}${a.letter}${a.romanNumeral} | Friendly: ${a.friendly} | Status: ${a.approved} | Submitted by: ${a.submitter.country}`
      );
      doc.fontSize(10).text(`  Content: ${a.content}`);
    });
    doc.moveDown();

    // Contributions
    doc.fontSize(16).text('Contributions:');
    contributions.forEach(c => {
      doc.fontSize(12).text(
        `- ${c.userRole.country}: Speeches: ${c.speeches}, Points: ${c.points}, Amendments: ${c.amendments}, Strikes: ${c.strikes}`
      );
    });
    doc.moveDown();

    // Voting
    doc.fontSize(16).text('Voting:');
    if (vote) {
      doc.fontSize(12).text(`Voting Open: ${vote.votingOpen}`);
      const tally = { yes: 0, no: 0, abstain: 0 };
      vote.votes.forEach(v => {
        tally[v.choice] = (tally[v.choice] || 0) + 1;
      });
      doc.fontSize(12).text(`Votes: Yes - ${tally.yes}, No - ${tally.no}, Abstain - ${tally.abstain}`);
    } else {
      doc.fontSize(12).text('No voting data.');
    }
    doc.moveDown();

    // Messages
    doc.fontSize(16).text('Messages:');
    messages.forEach(m => {
      doc.fontSize(12).text(
        `- From: ${m.senderCountry} To: ${m.receiverCountry} | Approved: ${m.approved} | Content: ${m.content}`
      );
    });

    doc.end();
  } catch (error) {
    console.error('Download PDF error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
