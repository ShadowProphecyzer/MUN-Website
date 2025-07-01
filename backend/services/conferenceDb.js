const mongoose = require('mongoose');

const connections = {};

// Message schema for per-conference chat
const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
  senderRole: { type: String, required: true },
  recipientRole: { type: String, required: true },
  senderName: { type: String, required: true },
  recipientName: { type: String, required: true },
  content: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
  moderatorId: { type: mongoose.Schema.Types.ObjectId },
  denialReason: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

function getConferenceDb(conferenceFolderName) {
  if (!connections[conferenceFolderName]) {
    const dbUri = process.env.MONGODB_URI.replace(/\/mun_website$/, `/${encodeURIComponent(conferenceFolderName)}`);
    const connection = mongoose.createConnection(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const Message = connection.model('Message', messageSchema, 'messages');
    connections[conferenceFolderName] = { connection, Message };
  }
  return connections[conferenceFolderName];
}

module.exports = { getConferenceDb }; 