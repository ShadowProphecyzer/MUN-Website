// public/js/socket.js

const socket = io(); // Connect to server (assumes same origin or specify URL)

// Join conference room (call after user joins a conference)
function joinConference(conferenceId) {
  socket.emit('joinConference', conferenceId);
}

// Send a chat message to another user (will go to moderator for approval)
function sendMessage(conferenceId, toUserId, content, senderId) {
  socket.emit('sendMessage', { conferenceId, toUserId, content, senderId });
}

// Listen for new pending messages (moderators only)
socket.on('newMessagePending', (message) => {
  // Show message in moderator approval UI
  console.log('New message pending approval:', message);
  // You'd update your UI here accordingly
});

// Moderator approves message
function approveMessage(conferenceId, messageId) {
  socket.emit('approveMessage', { conferenceId, messageId });
}

// Moderator declines message with reason
function declineMessage(conferenceId, messageId, reason) {
  socket.emit('declineMessage', { conferenceId, messageId, reason });
}

// Listen for approved chat messages (recipient sees this)
socket.on('chatMessageApproved', (message) => {
  console.log('Chat message approved:', message);
  // Update chat UI with approved message
});

// Listen for declined messages with reason (sender sees this)
socket.on('chatMessageDeclined', ({ messageId, reason }) => {
  console.log('Message declined:', messageId, 'Reason:', reason);
  // Show decline reason UI to sender
});

// Voting

// Chairs open voting
function openVoting(conferenceId) {
  socket.emit('openVoting', { conferenceId });
}

// Chairs close voting
function closeVoting(conferenceId) {
  socket.emit('closeVoting', { conferenceId });
}

// Delegates cast vote
function castVote(conferenceId, userId, choice) {
  socket.emit('castVote', { conferenceId, userId, choice });
}

// Listen for voting status updates
socket.on('votingStatus', (status) => {
  console.log('Voting status:', status);
  // Update UI to show voting open/closed
});

// Listen for vote tally updates
socket.on('voteUpdate', (vote) => {
  console.log('Vote updated:', vote);
  // Update vote tally UI
});

// Amendments

// Submit an amendment
function submitAmendment(conferenceId, amendment) {
  socket.emit('submitAmendment', { conferenceId, amendment });
}

// Chairs approve/decline amendment
function amendmentDecision(conferenceId, amendmentId, approved) {
  socket.emit('amendmentDecision', { conferenceId, amendmentId, approved });
}

// Listen for new amendments
socket.on('newAmendment', (amendment) => {
  console.log('New amendment:', amendment);
  // Update UI to show amendment
});

// Listen for amendment status updates
socket.on('amendmentStatusUpdate', ({ amendmentId, approved }) => {
  console.log('Amendment status update:', amendmentId, approved);
  // Update amendment UI color/status
});

// Contributions

// Chairs update contributions
function updateContribution(conferenceId, userId, type, value) {
  socket.emit('updateContribution', { conferenceId, userId, contributionType: type, value });
}

// Listen for contributions updates
socket.on('contributionUpdated', ({ userId, contributionType, value }) => {
  console.log('Contribution updated:', userId, contributionType, value);
  // Update contributions UI
});

// Make functions globally available
window.socketFunctions = {
  joinConference,
  sendMessage,
  approveMessage,
  declineMessage,
  openVoting,
  closeVoting,
  castVote,
  submitAmendment,
  amendmentDecision,
  updateContribution,
};
