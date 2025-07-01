const express = require('express');
const router = express.Router();
const { getConferenceDb } = require('../services/conferenceDb');
const Conference = require('../models/Conference');
const { authenticateToken } = require('../middleware/auth');

// Helper: Get conference folder name by code
async function getConferenceFolderName(code) {
  const conf = await Conference.findOne({ conferenceCode: code });
  return conf ? conf.folderPath.split(/[\\/]/).pop() : null;
}

// Helper: Get user info from conference people
function getPersonInfo(people, userId) {
  return people.find(p => p.userId.toString() === userId.toString());
}

// POST /api/conference/:code/chat/send
router.post('/:code/chat/send', authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;
    const { recipientId, content } = req.body;
    if (!recipientId || !content) return res.status(400).json({ success: false, message: 'Recipient and content required' });
    const folderName = await getConferenceFolderName(code);
    if (!folderName) return res.status(404).json({ success: false, message: 'Conference not found' });
    const { Message } = getConferenceDb(folderName);
    const conf = await Conference.findOne({ conferenceCode: code });
    if (!conf) return res.status(404).json({ success: false, message: 'Conference not found' });
    const sender = getPersonInfo(conf.people, req.user._id);
    const recipient = getPersonInfo(conf.people, recipientId);
    if (!sender || !recipient) return res.status(403).json({ success: false, message: 'Access denied' });
    // Moderation logic
    let status = 'pending';
    if (["god", "owner", "admin", "moderator"].includes(sender.role)) {
      status = 'approved';
    }
    const msg = await Message.create({
      senderId: sender.userId,
      recipientId: recipient.userId,
      senderRole: sender.role,
      recipientRole: recipient.role,
      senderName: getChatName(sender),
      recipientName: getChatName(recipient),
      content,
      status
    });
    // Real-time delivery
    const io = req.app.get('io');
    if (status === 'approved') {
      io.to(`conference_${code}_user_${recipient.userId}`).emit('chatMessage', msg);
      io.to(`conference_${code}_user_${sender.userId}`).emit('chatMessage', msg);
      // Notification
      io.to(`conference_${code}_user_${recipient.userId}`).emit('chatNotification', msg);
    } else {
      // Notify moderators
      conf.people.filter(p => p.role === 'moderator').forEach(m => {
        io.to(`conference_${code}_user_${m.userId}`).emit('pendingMessage', msg);
      });
    }
    res.json({ success: true, data: { message: msg } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// GET /api/conference/:code/chat/history/:userId
router.get('/:code/chat/history/:userId', authenticateToken, async (req, res) => {
  try {
    const { code, userId } = req.params;
    const folderName = await getConferenceFolderName(code);
    if (!folderName) return res.status(404).json({ success: false, message: 'Conference not found' });
    const { Message } = getConferenceDb(folderName);
    // Only show denied messages to sender and moderators
    const conf = await Conference.findOne({ conferenceCode: code });
    const me = getPersonInfo(conf.people, req.user._id);
    const other = getPersonInfo(conf.people, userId);
    if (!me || !other) return res.status(403).json({ success: false, message: 'Access denied' });
    let query = {
      $or: [
        { senderId: me.userId, recipientId: other.userId },
        { senderId: other.userId, recipientId: me.userId }
      ]
    };
    let messages = await Message.find(query).sort({ createdAt: 1 }).lean();
    if (!['moderator', 'god', 'owner', 'admin'].includes(me.role)) {
      // Hide denied messages not sent by me
      messages = messages.filter(m => m.status !== 'denied' || m.senderId.toString() === me.userId.toString());
    }
    res.json({ success: true, data: { messages } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get chat history' });
  }
});

// GET /api/conference/:code/chat/pending
router.get('/:code/chat/pending', authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;
    const folderName = await getConferenceFolderName(code);
    if (!folderName) return res.status(404).json({ success: false, message: 'Conference not found' });
    const { Message } = getConferenceDb(folderName);
    const conf = await Conference.findOne({ conferenceCode: code });
    const me = getPersonInfo(conf.people, req.user._id);
    if (!me || me.role !== 'moderator') return res.status(403).json({ success: false, message: 'Access denied' });
    const pending = await Message.find({ status: 'pending' }).sort({ createdAt: 1 }).lean();
    res.json({ success: true, data: { pending } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get pending messages' });
  }
});

// POST /api/conference/:code/chat/moderate
router.post('/:code/chat/moderate', authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;
    const { messageId, action, denialReason } = req.body;
    const folderName = await getConferenceFolderName(code);
    if (!folderName) return res.status(404).json({ success: false, message: 'Conference not found' });
    const { Message } = getConferenceDb(folderName);
    const conf = await Conference.findOne({ conferenceCode: code });
    const me = getPersonInfo(conf.people, req.user._id);
    if (!me || me.role !== 'moderator') return res.status(403).json({ success: false, message: 'Access denied' });
    const msg = await Message.findById(messageId);
    if (!msg || msg.status !== 'pending') return res.status(404).json({ success: false, message: 'Message not found or already moderated' });
    if (action === 'approve') {
      msg.status = 'approved';
      msg.moderatorId = me.userId;
      msg.denialReason = '';
    } else if (action === 'deny') {
      msg.status = 'denied';
      msg.moderatorId = me.userId;
      msg.denialReason = denialReason || 'No reason provided';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }
    msg.updatedAt = new Date();
    await msg.save();
    // Real-time delivery
    const io = req.app.get('io');
    if (msg.status === 'approved') {
      io.to(`conference_${code}_user_${msg.recipientId}`).emit('chatMessage', msg);
      io.to(`conference_${code}_user_${msg.senderId}`).emit('chatMessage', msg);
      io.to(`conference_${code}_user_${msg.recipientId}`).emit('chatNotification', msg);
    } else {
      // Notify sender and all moderators
      io.to(`conference_${code}_user_${msg.senderId}`).emit('chatMessage', msg);
      conf.people.filter(p => p.role === 'moderator').forEach(m => {
        io.to(`conference_${code}_user_${m.userId}`).emit('chatMessage', msg);
      });
    }
    res.json({ success: true, data: { message: msg } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to moderate message' });
  }
});

// Helper: Get chat display name
function getChatName(person) {
  if (person.role === 'delegate') return person.country || 'Delegate';
  if (['chair', 'admin'].includes(person.role)) return person.email.split('@')[0];
  return person.role.charAt(0).toUpperCase() + person.role.slice(1);
}

module.exports = router; 