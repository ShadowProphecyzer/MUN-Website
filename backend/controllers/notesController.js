// controllers/notesController.js
const Note = require('../models/Note');
const UserConferenceRole = require('../models/UserConferenceRole');

// Send message (creates a note with approved = false)
exports.sendMessage = async (req, res) => {
  const { conferenceId } = req.params;
  const senderId = req.user._id;
  const { recipientId, content } = req.body;

  if (senderId.toString() === recipientId) {
    return res.status(400).json({ message: "Cannot send message to yourself" });
  }

  try {
    // Verify sender and recipient are in the conference
    const senderRole = await UserConferenceRole.findOne({ user: senderId, conference: conferenceId });
    const recipientRole = await UserConferenceRole.findOne({ user: recipientId, conference: conferenceId });
    if (!senderRole || !recipientRole) {
      return res.status(400).json({ message: "Sender or recipient not in conference" });
    }

    const note = new Note({
      conference: conferenceId,
      sender: senderRole._id,
      recipient: recipientRole._id,
      content,
      approved: false,
      readBySender: true, // sender sees their own message as read
    });

    await note.save();

    res.status(201).json(note);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Moderator gets pending messages to approve/reject
exports.getPendingMessages = async (req, res) => {
  const { conferenceId } = req.params;

  try {
    const notes = await Note.find({ conference: conferenceId, approved: false })
      .populate('sender recipient', 'country role')
      .exec();
    res.json(notes);
  } catch (error) {
    console.error("Get pending messages error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Moderator approves or rejects a message
exports.reviewMessage = async (req, res) => {
  const { noteId } = req.params;
  const { approve, rejectionReason } = req.body;

  try {
    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ message: "Message not found" });

    note.approved = approve;
    if (!approve) {
      note.rejectionReason = rejectionReason || "No reason provided";
    } else {
      note.rejectionReason = "";
      note.approvedAt = Date.now();
    }

    await note.save();

    res.json(note);
  } catch (error) {
    console.error("Review message error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get messages between two users (approved only)
exports.getChatMessages = async (req, res) => {
  const { conferenceId } = req.params;
  const userId = req.user._id;
  const { otherUserId } = req.query;

  try {
    const userRole = await UserConferenceRole.findOne({ user: userId, conference: conferenceId });
    const otherUserRole = await UserConferenceRole.findOne({ user: otherUserId, conference: conferenceId });

    if (!userRole || !otherUserRole) {
      return res.status(400).json({ message: "Users not in conference" });
    }

    // Fetch approved messages between the two roles
    const messages = await Note.find({
      conference: conferenceId,
      approved: true,
      $or: [
        { sender: userRole._id, recipient: otherUserRole._id },
        { sender: otherUserRole._id, recipient: userRole._id },
      ],
    })
      .sort('createdAt')
      .exec();

    res.json(messages);
  } catch (error) {
    console.error("Get chat messages error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
