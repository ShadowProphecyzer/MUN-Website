// Global variables
let currentUser = null;
let currentConference = null;
let currentConferenceId = null;
let selectedRecipient = null;
let participants = [];
let pendingNotes = [];
let socket = null;

// DOM elements
const elements = {
    loadingOverlay: document.getElementById('loading-overlay'),
    statusMessage: document.getElementById('status-message'),
    participantsList: document.getElementById('participants-list'),
    chatHeader: document.getElementById('chat-header'),
    chatRecipientName: document.getElementById('chat-recipient-name'),
    chatRecipientRole: document.getElementById('chat-recipient-role'),
    messagesContainer: document.getElementById('messages-container'),
    messageInputContainer: document.getElementById('message-input-container'),
    messageInput: document.getElementById('message-input'),
    sendMessageBtn: document.getElementById('send-message-btn'),
    charCount: document.getElementById('char-count'),
    moderatorToggle: document.getElementById('moderation-panel-btn'),
    returnToDashboard: document.getElementById('return-to-dashboard')
};

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[NOTE] Application initialization started');
    showLoading();
    
    try {
        console.log('[NOTE] Starting authentication check');
        // Check authentication
        const isAuthenticated = await checkAuth();
        console.log('[NOTE] Authentication result:', isAuthenticated);
        if (!isAuthenticated) {
            console.log('[NOTE] Authentication failed, stopping initialization');
            return; // Auth error is already shown
        }
        
        console.log('[NOTE] Loading user info and conference');
        // Get user info and conference
        await loadUserInfo();
        
        console.log('[NOTE] Loading participants');
        // Load participants
        await loadParticipants();
        
        console.log('[NOTE] Current user role:', currentUser.role);
        // Show moderation panel button if user is moderator/god
        if (['moderator', 'god'].includes(currentUser.role)) {
            console.log('[NOTE] User is moderator/god, showing moderation panel button');
            elements.moderatorToggle.style.display = 'block';
        } else {
            console.log('[NOTE] User is not moderator/god, hiding moderation panel button');
        }
        
        console.log('[NOTE] Initializing WebSocket connection');
        // Initialize socket connection
        initializeSocket();
        
        console.log('[NOTE] Setting up event listeners');
        // Set up event listeners
        setupEventListeners();
        
        // Update user menu
        updateUserMenu();
        
        hideLoading();
        console.log('[NOTE] Application initialization completed successfully');
        showStatus('Note passing platform loaded successfully', 'success');
        
    } catch (error) {
        console.error('[NOTE] Error initializing application:', error);
        hideLoading();
        showStatus('Error loading application. Please refresh the page.', 'error');
    }
});

// Authentication check
async function checkAuth() {
    console.log('[NOTE] Starting authentication check');
    console.log('[NOTE] localStorage contents:', {
        token: localStorage.getItem('token'),
        authToken: localStorage.getItem('authToken'),
        userData: localStorage.getItem('userData')
    });
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    console.log('[NOTE] Token found:', !!token);
    
    if (!token) {
        console.log('[NOTE] No token found, showing auth error');
        console.log('[NOTE] User should log in first and access note passing through conference page');
        showAuthError('Authentication required. Please log in first and access note passing through the conference page.');
        return false;
    }
    
    try {
        console.log('[NOTE] Making auth verification request');
        const response = await fetch('/api/auth/check', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('[NOTE] Auth response status:', response.status);
        
        const data = await response.json();
        console.log('[NOTE] Auth response data:', data);
        
        if (!response.ok || !data.success || !data.authenticated) {
            console.log('[NOTE] Auth verification failed, clearing tokens');
            localStorage.removeItem('token');
            localStorage.removeItem('authToken');
            showAuthError('Your session has expired. Please log in again.');
            return false;
        }
        
        console.log('[NOTE] Auth verification successful, user data:', data.user);
        currentUser = data.user;
        return true;
        
    } catch (error) {
        console.error('[NOTE] Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        showAuthError('Authentication failed. Please check your connection and try again.');
        return false;
    }
}

// Show authentication error
function showAuthError(message) {
    hideLoading();
    console.log('[NOTE] Showing auth error:', message);
    elements.messagesContainer.innerHTML = `
        <div class="auth-error-container">
            <div class="auth-error-content">
                <h3>Authentication Required</h3>
                <p>${message}</p>
                <div class="auth-error-actions">
                    <button onclick="window.location.href='signin_signup.html'" class="btn-login">Log In</button>
                    <button onclick="goToConference()" class="btn-dashboard">Return to Conference</button>
                </div>
            </div>
        </div>
    `;
}

// Go to conference page
function goToConference() {
    console.log('[NOTE] goToConference function called');
    
    // Try to get conference code from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const conferenceId = urlParams.get('conferenceId');
    console.log('[NOTE] Conference ID from URL:', conferenceId);
    
    if (conferenceId) {
        console.log('[NOTE] Fetching conference details for ID:', conferenceId);
        
        // Get auth token
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        
        // Try to get conference code from the ID
        fetch(`/api/conference/id/${conferenceId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            console.log('[NOTE] Conference fetch response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('[NOTE] Conference fetch response data:', data);
            
            if (data.success && data.conference && data.conference.code) {
                console.log('[NOTE] Redirecting to conference page with code:', data.conference.code);
                window.location.href = `conference.html?code=${data.conference.code}`;
            } else {
                console.log('[NOTE] Conference data invalid, redirecting to dashboard');
                window.location.href = 'dashboard.html';
            }
        })
        .catch((error) => {
            console.error('[NOTE] Error fetching conference:', error);
            console.log('[NOTE] Redirecting to dashboard due to error');
            window.location.href = 'dashboard.html';
        });
    } else {
        console.log('[NOTE] No conference ID found, redirecting to dashboard');
        window.location.href = 'dashboard.html';
    }
}

// Load user information
async function loadUserInfo() {
  console.log('[NOTE] Loading user information');
  // Get conference ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  currentConferenceId = urlParams.get('conferenceId');
  console.log('[NOTE] Conference ID from URL:', currentConferenceId);
  console.log('[NOTE] Referrer:', document.referrer);
  console.log('[NOTE] Current URL:', window.location.href);
  
  if (!currentConferenceId) {
    console.log('[NOTE] No conference ID found in URL');
    showStatus('Conference ID is required. Please access this page with a valid conference ID.', 'error');
    return;
  }
  
  console.log('[NOTE] Loading conference details');
  // Load conference details
  await loadConferenceDetails();
  console.log('[NOTE] User info loaded:', currentUser.username, currentUser.role);
}

// Load conference details
async function loadConferenceDetails() {
  console.log('[NOTE] Loading conference details for ID:', currentConferenceId);
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    console.log('[NOTE] Making request to load conference details');
    const response = await fetch(`/api/notes/participants/${currentConferenceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('[NOTE] Conference details response status:', response.status);
    
    if (!response.ok) {
      console.log('[NOTE] Failed to load conference details, response not ok');
      throw new Error('Failed to load conference details');
    }
    
    const data = await response.json();
    console.log('[NOTE] Conference details response data:', data);
    currentConference = data.conference;
    console.log('[NOTE] Conference details loaded:', currentConference);
    
  } catch (error) {
    console.error('[NOTE] Error loading conference details:', error);
    showStatus('Error loading conference details', 'error');
  }
}

// Load participants
async function loadParticipants() {
  console.log('[NOTE] Loading participants for conference:', currentConferenceId);
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    console.log('[NOTE] Making request to load participants');
    const response = await fetch(`/api/notes/participants/${currentConferenceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('[NOTE] Participants response status:', response.status);
    
    if (!response.ok) {
      console.log('[NOTE] Failed to load participants, response not ok');
      throw new Error('Failed to load participants');
    }
    
    const data = await response.json();
    console.log('[NOTE] Participants response data:', data);
    participants = data.participants;
    console.log('[NOTE] Participants loaded:', participants.length, 'participants');
    renderParticipants();
    
  } catch (error) {
    console.error('[NOTE] Error loading participants:', error);
    showStatus('Error loading participants', 'error');
  }
}

// Render participants list
function renderParticipants() {
  console.log('[NOTE] Rendering participants list');
  elements.participantsList.innerHTML = '';
  
  if (participants.length === 0) {
    console.log('[NOTE] No participants found');
    elements.participantsList.innerHTML = '<p style="text-align: center; color: #cba135; padding: 20px;">No participants found</p>';
    return;
  }
  
  console.log('[NOTE] Rendering', participants.length, 'participants');
  participants.forEach((participant, index) => {
    console.log('[NOTE] Rendering participant', index + 1, ':', participant.username, participant.role);
    const participantElement = document.createElement('div');
    participantElement.className = 'participant-item';
    participantElement.dataset.participantId = participant._id;
    
    let displayRole = participant.role;
    if (participant.role.toLowerCase() === 'delegate' && participant.country && participant.country.trim() !== '') {
      displayRole = `Delegate of '${participant.country}'`;
    }
    
    participantElement.innerHTML = `
      <div class="participant-name">${displayRole}</div>
      <div class="participant-role">${participant.username}</div>
    `;
    
    participantElement.addEventListener('click', () => selectParticipant(participant));
    elements.participantsList.appendChild(participantElement);
  });
  console.log('[NOTE] Participants list rendered successfully');
}

// Select a participant for chat
function selectParticipant(participant) {
  console.log('[NOTE] Selecting participant:', participant.username, participant.role, participant._id);
  
  // Remove active class from all participants
  document.querySelectorAll('.participant-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Add active class to selected participant
  const selectedElement = document.querySelector(`[data-participant-id="${participant._id}"]`);
  if (selectedElement) {
    selectedElement.classList.add('active');
    console.log('[NOTE] Added active class to participant element');
  } else {
    console.log('[NOTE] Warning: Could not find participant element to add active class');
  }
  
  selectedRecipient = participant;
  elements.chatRecipientName.textContent = participant.role;
  elements.chatRecipientRole.textContent = participant.username;
  elements.messageInputContainer.style.display = 'block';
  console.log('[NOTE] Participant selected, loading conversation');
  
  // Load conversation
  loadConversation(participant._id);
}

// Load conversation between current user and selected recipient
async function loadConversation(recipientId) {
  console.log('[NOTE] Loading conversation with recipient:', recipientId);
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const url = `/api/notes/conversation/${recipientId}?conferenceId=${currentConferenceId}`;
    console.log('[NOTE] Making conversation request to:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('[NOTE] Conversation response status:', response.status);
    
    if (!response.ok) {
      console.log('[NOTE] Failed to load conversation, response not ok');
      throw new Error('Failed to load conversation');
    }
    
    const data = await response.json();
    console.log('[NOTE] Conversation response data:', data);
    console.log('[NOTE] Conversation notes count:', data.notes ? data.notes.length : 0);
    renderMessages(data.notes);
    
  } catch (error) {
    console.error('[NOTE] Error loading conversation:', error);
    showStatus('Error loading conversation', 'error');
  }
}

// Render messages in chat
function renderMessages(notes) {
  console.log('[NOTE] Rendering messages, count:', notes.length);
  elements.messagesContainer.innerHTML = '';
  
  if (notes.length === 0) {
    console.log('[NOTE] No messages found, showing welcome message');
    elements.messagesContainer.innerHTML = `
      <div class="welcome-message">
        <h4>No messages yet</h4>
        <p>Start the conversation by sending a message!</p>
      </div>
    `;
    return;
  }
  
  console.log('[NOTE] Rendering', notes.length, 'messages');
  notes.forEach((note, index) => {
    console.log('[NOTE] Rendering message', index + 1, ':', note.message.substring(0, 50) + '...');
    const messageElement = createMessageElement(note);
    elements.messagesContainer.appendChild(messageElement);
  });
  
  // Scroll to bottom
  elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
  console.log('[NOTE] Messages rendered successfully');
}

// Create message element
function createMessageElement(note) {
    const isSentByMe = note.sender._id === currentUser._id;
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSentByMe ? 'sent' : 'received'}`;
    
    const statusIcon = getStatusIcon(note.status);
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <p class="message-text">${escapeHtml(note.message)}</p>
            <div class="message-info">
                <div class="sender-info">${note.sender.role} - ${note.sender.username}</div>
                <div class="message-status">
                    <span class="status-icon ${getStatusClass(note.status)}" title="${note.status}">${statusIcon}</span>
                </div>
                <div class="message-time">${formatTime(note.createdAt)}</div>
            </div>
            ${note.rejectionReason ? `<div class="rejection-reason">Rejected: ${escapeHtml(note.rejectionReason)}</div>` : ''}
        </div>
    `;
    
    return messageDiv;
}

// Get status icon
function getStatusIcon(status) {
    switch (status) {
        case 'sent': return '⏳';
        case 'approved': return '✅';
        case 'rejected': return '❌';
        default: return '📤';
    }
}

// Get status text (removed - only icons now)
function getStatusText(status) {
    return '';
}

// Get status class
function getStatusClass(status) {
    switch (status) {
        case 'sent': return 'status-sent';
        case 'approved': return 'status-approved';
        case 'rejected': return 'status-rejected';
        default: return 'status-sent';
    }
}

// Send message
async function sendMessage() {
  console.log('[NOTE] Send message function called');
  
  if (!selectedRecipient) {
    console.log('[NOTE] No recipient selected');
    showStatus('Please select a recipient first', 'error');
    return;
  }
  
  const message = elements.messageInput.value.trim();
  console.log('[NOTE] Message content:', message);
  
  if (!message) {
    console.log('[NOTE] Empty message');
    showStatus('Please enter a message', 'error');
    return;
  }
  
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const requestBody = {
      recipientId: selectedRecipient._id,
      message: message,
      conferenceId: currentConferenceId
    };
    console.log('[NOTE] Sending message with data:', requestBody);
    
    const response = await fetch('/api/notes/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('[NOTE] Send message response status:', response.status);
    
    if (!response.ok) {
      console.log('[NOTE] Failed to send message, response not ok');
      throw new Error('Failed to send message');
    }
    
    const data = await response.json();
    console.log('[NOTE] Send message response data:', data);
    
    // Clear input
    elements.messageInput.value = '';
    updateCharCount();
    
    // Add message to chat
    const messageElement = createMessageElement(data.note);
    elements.messagesContainer.appendChild(messageElement);
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    
    console.log('[NOTE] Message sent successfully');
    showStatus('Message sent for approval', 'success');
    
    // Update pending notes if user is moderator
    if (['moderator', 'admin'].includes(currentUser.role)) {
      console.log('[NOTE] User is moderator, updating pending notes');
      await loadPendingNotes();
    }
    
  } catch (error) {
    console.error('[NOTE] Error sending message:', error);
    showStatus('Error sending message', 'error');
  }
}

// Load pending notes for moderators
async function loadPendingNotes() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/notes/pending?conferenceId=${currentConferenceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load pending notes');
    }
    
    const data = await response.json();
    pendingNotes = data.notes;
    renderPendingNotes();
    
  } catch (error) {
    console.error('Error loading pending notes:', error);
    showStatus('Error loading pending notes', 'error');
  }
}

// Render pending notes
function renderPendingNotes() {
    elements.pendingNotes.innerHTML = '';
    
    if (pendingNotes.length === 0) {
        elements.pendingNotes.innerHTML = '<p style="text-align: center; color: #cba135; padding: 20px;">No pending notes</p>';
        return;
    }
    
    pendingNotes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'pending-note';
        noteElement.dataset.noteId = note._id;
        
        noteElement.innerHTML = `
            <div class="pending-note-header">
                <div class="pending-note-info">
                    <div class="pending-note-sender">From: ${note.sender.username}</div>
                    <div class="pending-note-recipient">To: ${note.recipient.username}</div>
                    <div class="pending-note-time">${formatTime(note.createdAt)}</div>
                </div>
            </div>
            <div class="pending-note-message">${escapeHtml(note.message)}</div>
            <div class="pending-note-actions">
                <button class="btn-approve" onclick="approveNote('${note._id}')">Approve</button>
                <button class="btn-reject" onclick="rejectNote('${note._id}')">Reject</button>
            </div>
        `;
        
        elements.pendingNotes.appendChild(noteElement);
    });
}

// Approve a note
async function approveNote(noteId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/notes/approve/${noteId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to approve note');
        }
        
        showStatus('Note approved successfully', 'success');
        await loadPendingNotes();
        
    } catch (error) {
        console.error('Error approving note:', error);
        showStatus('Error approving note', 'error');
    }
}

// Reject a note
async function rejectNote(noteId) {
    // Show rejection modal
    elements.rejectionModal.style.display = 'block';
    elements.rejectionReason.value = '';
    
    // Store note ID for confirmation
    elements.confirmRejectBtn.onclick = async () => {
        const reason = elements.rejectionReason.value.trim();
        if (!reason) {
            showStatus('Please provide a rejection reason', 'error');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/notes/reject/${noteId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ rejectionReason: reason })
            });
            
            if (!response.ok) {
                throw new Error('Failed to reject note');
            }
            
            showStatus('Note rejected successfully', 'success');
            await loadPendingNotes();
            elements.rejectionModal.style.display = 'none';
            
        } catch (error) {
            console.error('Error rejecting note:', error);
            showStatus('Error rejecting note', 'error');
        }
    };
}

// Initialize WebSocket connection
function initializeSocket() {
  console.log('[NOTE] Initializing WebSocket connection');
  
  // Check if Socket.IO is available
  if (typeof io === 'undefined') {
    console.warn('[NOTE] Socket.IO not available, real-time updates disabled');
    return;
  }
  
  // Connect to WebSocket server
  socket = io();
  console.log('[NOTE] Socket.io instance created');
  
  // Join conference room
  console.log('[NOTE] Joining conference room:', currentConferenceId);
  socket.emit('join-conference', currentConferenceId);
  
  // Listen for note events
  socket.on('note-created', (data) => {
    console.log('[NOTE] WebSocket: note-created event received:', data);
    if (data.conferenceId === currentConferenceId) {
      console.log('[NOTE] Note created in current conference, updating UI');
      showStatus('New note received', 'info');
      if (selectedRecipient) {
        loadConversation(selectedRecipient._id);
      }
      if (['moderator', 'admin'].includes(currentUser.role)) {
        loadPendingNotes();
      }
    } else {
      console.log('[NOTE] Note created in different conference, ignoring');
    }
  });
  
  socket.on('note-approved', (data) => {
    console.log('[NOTE] WebSocket: note-approved event received:', data);
    if (data.conferenceId === currentConferenceId) {
      console.log('[NOTE] Note approved in current conference, updating UI');
      showStatus('A note was approved', 'info');
      if (selectedRecipient) {
        loadConversation(selectedRecipient._id);
      }
      if (['moderator', 'admin'].includes(currentUser.role)) {
        loadPendingNotes();
      }
    } else {
      console.log('[NOTE] Note approved in different conference, ignoring');
    }
  });
  
  socket.on('note-rejected', (data) => {
    console.log('[NOTE] WebSocket: note-rejected event received:', data);
    if (data.conferenceId === currentConferenceId) {
      console.log('[NOTE] Note rejected in current conference, updating UI');
      showStatus('A note was rejected', 'info');
      if (selectedRecipient) {
        loadConversation(selectedRecipient._id);
      }
      if (['moderator', 'admin'].includes(currentUser.role)) {
        loadPendingNotes();
      }
    } else {
      console.log('[NOTE] Note rejected in different conference, ignoring');
    }
  });
  
  socket.on('connect', () => {
    console.log('[NOTE] Connected to WebSocket server');
  });
  
  socket.on('disconnect', () => {
    console.log('[NOTE] Disconnected from WebSocket server');
  });
  
  socket.on('error', (error) => {
    console.error('[NOTE] WebSocket error:', error);
  });
}

// Update user menu with current user info
function updateUserMenu() {
    console.log('[NOTE] Updating user menu');
    const userNameElement = document.getElementById('userName');
    if (userNameElement && currentUser) {
        userNameElement.textContent = currentUser.username || currentUser.displayName || 'User';
        console.log('[NOTE] User menu updated with:', currentUser.username);
    }
}

// Leave conference function
function leaveConference() {
    console.log('[NOTE] Leave conference function called');
    // Clear conference-specific data
    localStorage.removeItem('currentConference');
    localStorage.removeItem('conferenceId');
    
    // Redirect to dashboard
    window.location.href = 'dashboard.html';
}

// Setup event listeners
function setupEventListeners() {
    console.log('[NOTE] Setting up event listeners');
    
    // Send message button
    elements.sendMessageBtn.addEventListener('click', sendMessage);
    
    // Message input
    elements.messageInput.addEventListener('input', updateCharCount);
    elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Character count
    updateCharCount();
    
    // Moderation panel button
    elements.moderatorToggle.addEventListener('click', () => {
        const code = getConferenceCodeFromURL();
        window.location.href = `moderation.html?code=${code}`;
    });
    
    // Return to conference button
    elements.returnToDashboard.addEventListener('click', goToConference);
    
    // Leave conference button
    const leaveConferenceBtn = document.querySelector('.leave-conference-btn');
    if (leaveConferenceBtn) {
        leaveConferenceBtn.addEventListener('click', leaveConference);
        console.log('[NOTE] Leave conference button event listener added');
    }
    
    // Modal events
    elements.closeRejectionModal.addEventListener('click', () => {
        elements.rejectionModal.style.display = 'none';
    });
    
    elements.cancelRejectBtn.addEventListener('click', () => {
        elements.rejectionModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === elements.rejectionModal) {
            elements.rejectionModal.style.display = 'none';
        }
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (socket) {
            socket.emit('leave-conference', currentConferenceId);
            socket.disconnect();
        }
    });
}

// Update character count
function updateCharCount() {
    const count = elements.messageInput.value.length;
    elements.charCount.textContent = count;
    
    if (count > 900) {
        elements.charCount.style.color = '#f44336';
    } else if (count > 800) {
        elements.charCount.style.color = '#ff9800';
    } else {
        elements.charCount.style.color = 'rgba(245, 230, 197, 0.6)';
    }
}

// Utility functions
function showLoading() {
  console.log('[NOTE] Showing loading overlay');
  elements.loadingOverlay.style.display = 'flex';
}

function hideLoading() {
  console.log('[NOTE] Hiding loading overlay');
  elements.loadingOverlay.style.display = 'none';
}

function showStatus(message, type = 'info') {
  console.log('[NOTE] Showing status message:', message, 'Type:', type);
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message ${type} show`;
  
  setTimeout(() => {
    elements.statusMessage.classList.remove('show');
    console.log('[NOTE] Status message hidden');
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getConferenceCodeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('conferenceId');
}
