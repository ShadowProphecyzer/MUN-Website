const http = require('http');
const socketio = require('socket.io');

// ... existing imports and app setup

const app = express();

// Middleware and routes here (same as before)

// Create HTTP server from express app
const server = http.createServer(app);

// Setup Socket.IO server
const io = socketio(server, {
  cors: {
    origin: '*',  // Update with your frontend URL in production
    methods: ['GET', 'POST']
  }
});

// Make io accessible in routes/controllers if needed
app.set('io', io);

// Socket.IO connection logic
io.on('connection', (socket) => {
  console.log(`New WS connection: ${socket.id}`);

  // Join conference room
  socket.on('joinConference', (conferenceId) => {
    socket.join(conferenceId);
    console.log(`Socket ${socket.id} joined conference ${conferenceId}`);
  });

  // Chat message sent (to moderator approval)
  socket.on('sendMessage', async ({ conferenceId, toUserId, content, senderId }) => {
    // Here you would save message with approved: false
    // Then notify moderators for approval (emit to mod room)
    // Example:
    io.to(conferenceId).emit('newMessagePending', { toUserId, content, senderId });
  });

  // Moderator approves message
  socket.on('approveMessage', ({ conferenceId, messageId }) => {
    // Update message approved flag in DB
    // Emit approved message to recipient room
    io.to(conferenceId).emit('chatMessageApproved', { messageId });
  });

  // Moderator declines message
  socket.on('declineMessage', ({ conferenceId, messageId, reason }) => {
    // Update message status with decline and reason
    io.to(conferenceId).emit('chatMessageDeclined', { messageId, reason });
  });

  // Voting events
  socket.on('openVoting', ({ conferenceId }) => {
    io.to(conferenceId).emit('votingStatus', { open: true });
  });
  socket.on('closeVoting', ({ conferenceId }) => {
    io.to(conferenceId).emit('votingStatus', { open: false });
  });
  socket.on('castVote', ({ conferenceId, userId, choice }) => {
    // Store vote in DB, then emit updated tally
    io.to(conferenceId).emit('voteUpdate', { userId, choice });
  });

  // Amendments events
  socket.on('submitAmendment', ({ conferenceId, amendment }) => {
    io.to(conferenceId).emit('newAmendment', amendment);
  });
  socket.on('amendmentDecision', ({ conferenceId, amendmentId, approved }) => {
    io.to(conferenceId).emit('amendmentStatusUpdate', { amendmentId, approved });
  });

  // Contributions updates
  socket.on('updateContribution', ({ conferenceId, userId, contributionType, value }) => {
    io.to(conferenceId).emit('contributionUpdated', { userId, contributionType, value });
  });

  // Leave room on disconnect
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Start server with Socket.IO
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const conferenceRoutes = require('./routes/conferenceRoutes');
app.use('/api/conference', conferenceRoutes);
