// Global variables
let currentUser = null;
let currentConferenceId = null;
let currentConference = null;
let participants = [];
let selectedRecipient = null;
let socket = null;
let currentUserRole = null;
let userPermissions = null;
let isModeratorPanelVisible = false;

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
    moderatorPanel: document.getElementById('moderator-panel'),
    pendingNotes: document.getElementById('pending-notes'),
    rejectionModal: document.getElementById('rejection-modal'),
    rejectionReason: document.getElementById('rejection-reason'),
    confirmRejectBtn: document.getElementById('confirm-reject-btn'),
    cancelRejectBtn: document.getElementById('cancel-reject-btn'),
    closeRejectionModal: document.getElementById('close-rejection-modal'),
    refreshParticipants: document.getElementById('refresh-participants'),
    refreshPending: document.getElementById('refresh-pending'),
    returnToDashboard: document.getElementById('return-to-dashboard'),
    moderatorToggle: document.getElementById('moderator-toggle')
};

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[HIERARCHICAL-NOTE] Application initialization started');
    showLoading();
    
    try {
        console.log('[HIERARCHICAL-NOTE] Starting authentication check');
        const isAuthenticated = await checkAuth();
        console.log('[HIERARCHICAL-NOTE] Authentication result:', isAuthenticated);
        if (!isAuthenticated) {
            console.log('[HIERARCHICAL-NOTE] Authentication failed, stopping initialization');
            return;
        }
        
        console.log('[HIERARCHICAL-NOTE] Loading user info and conference');
        await loadUserInfo();
        
        console.log('[HIERARCHICAL-NOTE] Loading participants');
        await loadParticipants();
        
        console.log('[HIERARCHICAL-NOTE] Current user role:', currentUserRole);
        
        // Show moderator panel if user can moderate
        if (['god', 'moderator'].includes(currentUserRole)) {
            console.log('[HIERARCHICAL-NOTE] User can moderate, showing moderator toggle');
            elements.moderatorToggle.style.display = 'flex';
            await loadPendingNotes();
        } else {
            console.log('[HIERARCHICAL-NOTE] User cannot moderate, hiding moderator toggle');
        }
        
        console.log('[HIERARCHICAL-NOTE] Initializing WebSocket connection');
        initializeSocket();
        
        console.log('[HIERARCHICAL-NOTE] Setting up event listeners');
        setupEventListeners();
        
        updateUserMenu();
        
        hideLoading();
        console.log('[HIERARCHICAL-NOTE] Application initialization completed successfully');
        showStatus('Hierarchical note passing platform loaded successfully', 'success');
        
    } catch (error) {
        console.error('[HIERARCHICAL-NOTE] Error initializing application:', error);
        hideLoading();
        showStatus('Error loading application. Please refresh the page.', 'error');
    }
});

// Authentication check
async function checkAuth() {
    console.log('[HIERARCHICAL-NOTE] Starting authentication check');
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    console.log('[HIERARCHICAL-NOTE] Token found:', !!token);
    
    if (!token) {
        console.log('[HIERARCHICAL-NOTE] No token found, showing auth error');
        showAuthError('Authentication required. Please log in first and access note passing through the conference page.');
        return false;
    }
    
    try {
        console.log('[HIERARCHICAL-NOTE] Making auth verification request');
        const response = await fetch('/api/auth/check', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('[HIERARCHICAL-NOTE] Auth response status:', response.status);
        
        if (!response.ok) {
            console.log('[HIERARCHICAL-NOTE] Auth verification failed');
            throw new Error('Authentication failed');
        }
        
        const data = await response.json();
        console.log('[HIERARCHICAL-NOTE] Auth response data:', data);
        
        if (data.success && data.authenticated) {
            currentUser = data.user;
            console.log('[HIERARCHICAL-NOTE] Auth verification successful, user data:', currentUser);
            return true;
        } else {
            console.log('[HIERARCHICAL-NOTE] Auth verification failed, clearing tokens');
            localStorage.removeItem('token');
            localStorage.removeItem('authToken');
            showAuthError('Authentication failed. Please log in again.');
            return false;
        }
    } catch (error) {
        console.error('[HIERARCHICAL-NOTE] Error during authentication:', error);
        showAuthError('Authentication error. Please refresh the page.');
        return false;
    }
}

// Show authentication error
function showAuthError(message) {
    console.log('[HIERARCHICAL-NOTE] Showing auth error:', message);
    hideLoading();
    
    const authErrorContainer = document.createElement('div');
    authErrorContainer.className = 'auth-error-container';
    authErrorContainer.innerHTML = `
        <div class="auth-error-content">
            <h3>Authentication Required</h3>
            <p>${message}</p>
            <div class="auth-error-actions">
                <button onclick="window.location.href='signin_signup.html'" class="btn-login">Log In</button>
                <button onclick="goToConference()" class="btn-dashboard">Return to Conference</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(authErrorContainer);
}

// Go to conference page
function goToConference() {
    console.log('[HIERARCHICAL-NOTE] goToConference function called');
    
    const urlParams = new URLSearchParams(window.location.search);
    const conferenceId = urlParams.get('conferenceId');
    console.log('[HIERARCHICAL-NOTE] Conference ID from URL:', conferenceId);
    
    if (conferenceId) {
        console.log('[HIERARCHICAL-NOTE] Fetching conference details for ID:', conferenceId);
        
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        
        fetch(`/api/conference/id/${conferenceId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            console.log('[HIERARCHICAL-NOTE] Conference fetch response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('[HIERARCHICAL-NOTE] Conference fetch response data:', data);
            
            if (data.success && data.conference && data.conference.code) {
                console.log('[HIERARCHICAL-NOTE] Redirecting to conference page with code:', data.conference.code);
                window.location.href = `conference.html?code=${data.conference.code}`;
            } else {
                console.log('[HIERARCHICAL-NOTE] Conference data invalid, redirecting to dashboard');
                window.location.href = 'dashboard.html';
            }
        })
        .catch((error) => {
            console.error('[HIERARCHICAL-NOTE] Error fetching conference:', error);
            console.log('[HIERARCHICAL-NOTE] Redirecting to dashboard due to error');
            window.location.href = 'dashboard.html';
        });
    } else {
        console.log('[HIERARCHICAL-NOTE] No conference ID found, redirecting to dashboard');
        window.location.href = 'dashboard.html';
    }
}

// Load user information
async function loadUserInfo() {
    console.log('[HIERARCHICAL-NOTE] Loading user information');
    const urlParams = new URLSearchParams(window.location.search);
    currentConferenceId = urlParams.get('conferenceId');
    console.log('[HIERARCHICAL-NOTE] Conference ID from URL:', currentConferenceId);
    
    if (!currentConferenceId) {
        console.log('[HIERARCHICAL-NOTE] No conference ID found in URL');
        showStatus('Conference ID is required. Please access this page with a valid conference ID.', 'error');
        return;
    }
    
    console.log('[HIERARCHICAL-NOTE] Loading conference details');
    await loadConferenceDetails();
    console.log('[HIERARCHICAL-NOTE] User info loaded:', currentUser.username, currentUserRole);
}

// Load conference details
async function loadConferenceDetails() {
    console.log('[HIERARCHICAL-NOTE] Loading conference details for ID:', currentConferenceId);
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        console.log('[HIERARCHICAL-NOTE] Making request to load conference details');
        const response = await fetch(`/api/hierarchical-notes/participants/${currentConferenceId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('[HIERARCHICAL-NOTE] Conference details response status:', response.status);
        
        if (!response.ok) {
            console.log('[HIERARCHICAL-NOTE] Failed to load conference details, response not ok');
            throw new Error('Failed to load conference details');
        }
        
        const data = await response.json();
        console.log('[HIERARCHICAL-NOTE] Conference details response data:', data);
        currentConference = data.conference;
        currentUserRole = data.currentUserRole;
        userPermissions = data.permissions;
        participants = data.participants;
        console.log('[HIERARCHICAL-NOTE] Conference details loaded:', currentConference);
        console.log('[HIERARCHICAL-NOTE] User role:', currentUserRole);
        console.log('[HIERARCHICAL-NOTE] User permissions:', userPermissions);
        
    } catch (error) {
        console.error('[HIERARCHICAL-NOTE] Error loading conference details:', error);
        showStatus('Error loading conference details', 'error');
    }
}

// Load participants
async function loadParticipants() {
    console.log('[HIERARCHICAL-NOTE] Loading participants for conference:', currentConferenceId);
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        console.log('[HIERARCHICAL-NOTE] Making request to load participants');
        const response = await fetch(`/api/hierarchical-notes/participants/${currentConferenceId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('[HIERARCHICAL-NOTE] Participants response status:', response.status);
        
        if (!response.ok) {
            console.log('[HIERARCHICAL-NOTE] Failed to load participants, response not ok');
            throw new Error('Failed to load participants');
        }
        
        const data = await response.json();
        console.log('[HIERARCHICAL-NOTE] Participants response data:', data);
        participants = data.participants;
        console.log('[HIERARCHICAL-NOTE] Participants loaded:', participants.length, 'participants');
        renderParticipants();
        
    } catch (error) {
        console.error('[HIERARCHICAL-NOTE] Error loading participants:', error);
        showStatus('Error loading participants', 'error');
    }
}

// Render participants list
function renderParticipants() {
    console.log('[HIERARCHICAL-NOTE] Rendering participants list');
    elements.participantsList.innerHTML = '';
    
    if (participants.length === 0) {
        console.log('[HIERARCHICAL-NOTE] No participants found');
        elements.participantsList.innerHTML = '<p style="text-align: center; color: #cba135; padding: 20px;">No participants found</p>';
        return;
    }
    
    console.log('[HIERARCHICAL-NOTE] Rendering', participants.length, 'participants');
    participants.forEach((participant, index) => {
        console.log('[HIERARCHICAL-NOTE] Rendering participant', index + 1, ':', participant.username, participant.role);
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
    console.log('[HIERARCHICAL-NOTE] Participants list rendered successfully');
}

// Select a participant for chat
function selectParticipant(participant) {
    console.log('[HIERARCHICAL-NOTE] Selecting participant:', participant.username, participant.role, participant._id);
    
    // Remove active class from all participants
    document.querySelectorAll('.participant-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to selected participant
    const selectedElement = document.querySelector(`[data-participant-id="${participant._id}"]`);
    if (selectedElement) {
        selectedElement.classList.add('active');
        console.log('[HIERARCHICAL-NOTE] Added active class to participant element');
    }
    
    selectedRecipient = participant;
    elements.chatRecipientName.textContent = participant.role;
    elements.chatRecipientRole.textContent = participant.username;
    elements.messageInputContainer.style.display = 'block';
    console.log('[HIERARCHICAL-NOTE] Participant selected, loading conversation');
    
    // Load conversation
    loadConversation(participant._id);
}

// Load conversation between current user and selected recipient
async function loadConversation(recipientId) {
    console.log('[HIERARCHICAL-NOTE] Loading conversation with recipient:', recipientId);
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const url = `/api/hierarchical-notes/conversation/${recipientId}?conferenceId=${currentConferenceId}`;
        console.log('[HIERARCHICAL-NOTE] Making conversation request to:', url);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('[HIERARCHICAL-NOTE] Conversation response status:', response.status);
        
        if (!response.ok) {
            console.log('[HIERARCHICAL-NOTE] Failed to load conversation, response not ok');
            throw new Error('Failed to load conversation');
        }
        
        const data = await response.json();
        console.log('[HIERARCHICAL-NOTE] Conversation response data:', data);
        console.log('[HIERARCHICAL-NOTE] Conversation notes count:', data.notes ? data.notes.length : 0);
        renderMessages(data.notes);
        
    } catch (error) {
        console.error('[HIERARCHICAL-NOTE] Error loading conversation:', error);
        showStatus('Error loading conversation', 'error');
    }
}

// Render messages in chat
function renderMessages(notes) {
    console.log('[HIERARCHICAL-NOTE] Rendering messages, count:', notes.length);
    elements.messagesContainer.innerHTML = '';
    
    if (notes.length === 0) {
        console.log('[HIERARCHICAL-NOTE] No messages found, showing welcome message');
        elements.messagesContainer.innerHTML = `
            <div class="welcome-message">
                <h4>No messages yet</h4>
                <p>Start the conversation by sending a message!</p>
            </div>
        `;
        return;
    }
    
    notes.forEach(note => {
        const messageElement = createMessageElement(note);
        elements.messagesContainer.appendChild(messageElement);
    });
    
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    console.log('[HIERARCHICAL-NOTE] Messages rendered successfully');
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
        case 'waiting': return '⏳';
        case 'approved': return '✅';
        case 'rejected': return '❌';
        default: return '📤';
    }
}

// Get status class
function getStatusClass(status) {
    switch (status) {
        case 'waiting': return 'status-sent';
        case 'approved': return 'status-approved';
        case 'rejected': return 'status-rejected';
        default: return 'status-sent';
    }
}

// Send message
async function sendMessage() {
    console.log('[HIERARCHICAL-NOTE] Send message function called');
    
    if (!selectedRecipient) {
        console.log('[HIERARCHICAL-NOTE] No recipient selected');
        showStatus('Please select a recipient first', 'error');
        return;
    }
    
    const message = elements.messageInput.value.trim();
    console.log('[HIERARCHICAL-NOTE] Message content:', message);
    
    if (!message) {
        console.log('[HIERARCHICAL-NOTE] Empty message');
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
        console.log('[HIERARCHICAL-NOTE] Sending message with data:', requestBody);
        
        const response = await fetch('/api/hierarchical-notes/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('[HIERARCHICAL-NOTE] Send message response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.log('[HIERARCHICAL-NOTE] Failed to send message:', errorData);
            showStatus(errorData.message || 'Failed to send message', 'error');
            return;
        }
        
        const data = await response.json();
        console.log('[HIERARCHICAL-NOTE] Send message response data:', data);
        
        // Clear input
        elements.messageInput.value = '';
        updateCharCount();
        
        // Add message to chat
        const messageElement = createMessageElement(data.note);
        elements.messagesContainer.appendChild(messageElement);
        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
        
        console.log('[HIERARCHICAL-NOTE] Message sent successfully');
        showStatus(data.message, 'success');
        
        // Update pending notes if user is moderator
        if (['god', 'moderator'].includes(currentUserRole)) {
            console.log('[HIERARCHICAL-NOTE] User is moderator, updating pending notes');
            await loadPendingNotes();
        }
        
    } catch (error) {
        console.error('[HIERARCHICAL-NOTE] Error sending message:', error);
        showStatus('Error sending message', 'error');
    }
}

// Load pending notes for moderation
async function loadPendingNotes() {
    console.log('[HIERARCHICAL-NOTE] Loading pending notes for conference:', currentConferenceId);
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        console.log('[HIERARCHICAL-NOTE] Making request to load pending notes');
        const response = await fetch(`/api/hierarchical-notes/pending/${currentConferenceId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('[HIERARCHICAL-NOTE] Pending notes response status:', response.status);
        
        if (!response.ok) {
            console.log('[HIERARCHICAL-NOTE] Failed to load pending notes, response not ok');
            throw new Error('Failed to load pending notes');
        }
        
        const data = await response.json();
        console.log('[HIERARCHICAL-NOTE] Pending notes response data:', data);
        renderPendingNotes(data.notes);
        
    } catch (error) {
        console.error('[HIERARCHICAL-NOTE] Error loading pending notes:', error);
        showStatus('Error loading pending notes', 'error');
    }
}

// Render pending notes
function renderPendingNotes(notes) {
    console.log('[HIERARCHICAL-NOTE] Rendering pending notes, count:', notes.length);
    elements.pendingNotes.innerHTML = '';
    
    if (notes.length === 0) {
        console.log('[HIERARCHICAL-NOTE] No pending notes found');
        elements.pendingNotes.innerHTML = '<p style="text-align: center; color: #cba135; padding: 20px;">No pending notes</p>';
        return;
    }
    
    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'pending-note';
        noteElement.dataset.noteId = note._id;
        
        const isLocked = note.lockedBy && note.lockedBy._id !== currentUser._id;
        const isLockedByMe = note.lockedBy && note.lockedBy._id === currentUser._id;
        
        noteElement.innerHTML = `
            <div class="pending-note-header">
                <div class="pending-note-info">
                    <div class="pending-note-sender">From: ${note.sender.role} - ${note.sender.username}</div>
                    <div class="pending-note-recipient">To: ${note.recipient.role} - ${note.recipient.username}</div>
                    <div class="pending-note-time">${formatTime(note.createdAt)}</div>
                </div>
                ${isLocked ? `<div class="locked-indicator">🔒 Locked by ${note.lockedBy.username}</div>` : ''}
            </div>
            <div class="pending-note-message">${escapeHtml(note.message)}</div>
            <div class="pending-note-actions">
                ${!isLocked ? `<button class="btn-lock" onclick="lockNote('${note._id}')">🔒 Lock</button>` : ''}
                ${isLockedByMe ? `
                    <button class="btn-approve" onclick="approveNote('${note._id}')">✅ Approve</button>
                    <button class="btn-reject" onclick="rejectNote('${note._id}')">❌ Reject</button>
                ` : ''}
            </div>
        `;
        
        elements.pendingNotes.appendChild(noteElement);
    });
    
    console.log('[HIERARCHICAL-NOTE] Pending notes rendered successfully');
}

// Lock a note for moderation
async function lockNote(noteId) {
    console.log('[HIERARCHICAL-NOTE] Locking note:', noteId);
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const response = await fetch(`/api/hierarchical-notes/lock/${noteId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            showStatus(errorData.message || 'Failed to lock note', 'error');
            return;
        }
        
        showStatus('Note locked successfully', 'success');
        await loadPendingNotes();
        
    } catch (error) {
        console.error('[HIERARCHICAL-NOTE] Error locking note:', error);
        showStatus('Error locking note', 'error');
    }
}

// Approve a note
async function approveNote(noteId) {
    console.log('[HIERARCHICAL-NOTE] Approving note:', noteId);
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const response = await fetch(`/api/hierarchical-notes/approve/${noteId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            showStatus(errorData.message || 'Failed to approve note', 'error');
            return;
        }
        
        showStatus('Note approved successfully', 'success');
        await loadPendingNotes();
        
    } catch (error) {
        console.error('[HIERARCHICAL-NOTE] Error approving note:', error);
        showStatus('Error approving note', 'error');
    }
}

// Reject a note
async function rejectNote(noteId) {
    console.log('[HIERARCHICAL-NOTE] Rejecting note:', noteId);
    
    // Show rejection modal
    elements.rejectionModal.style.display = 'block';
    elements.rejectionReason.value = '';
    
    elements.confirmRejectBtn.onclick = async () => {
        const reason = elements.rejectionReason.value.trim();
        
        if (!reason) {
            showStatus('Please provide a rejection reason', 'error');
            return;
        }
        
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const response = await fetch(`/api/hierarchical-notes/reject/${noteId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                showStatus(errorData.message || 'Failed to reject note', 'error');
                return;
            }
            
            elements.rejectionModal.style.display = 'none';
            showStatus('Note rejected successfully', 'success');
            await loadPendingNotes();
            
        } catch (error) {
            console.error('[HIERARCHICAL-NOTE] Error rejecting note:', error);
            showStatus('Error rejecting note', 'error');
        }
    };
}

// Navigate to moderation panel
function goToModerationPanel() {
    console.log('[HIERARCHICAL-NOTE] Navigating to moderation panel');
    const code = getConferenceCodeFromURL();
    window.location.href = `moderation.html?code=${code}`;
}

// Initialize WebSocket connection
function initializeSocket() {
    console.log('[HIERARCHICAL-NOTE] Initializing WebSocket connection');
    
    if (typeof io === 'undefined') {
        console.warn('[HIERARCHICAL-NOTE] Socket.IO not available, real-time updates disabled');
        return;
    }
    
    socket = io();
    console.log('[HIERARCHICAL-NOTE] Socket.io instance created');
    
    // Join conference room
    socket.emit('join-conference', currentConferenceId);
    console.log('[HIERARCHICAL-NOTE] Joined conference room:', currentConferenceId);
    
    // Listen for new notes
    socket.on('hierarchical-note-created', (data) => {
        console.log('[HIERARCHICAL-NOTE] New note received:', data);
        if (data.note.sender._id === currentUser._id || data.note.recipient._id === currentUser._id) {
            // Add to current conversation if it's the selected recipient
            if (selectedRecipient && (data.note.sender._id === selectedRecipient._id || data.note.recipient._id === selectedRecipient._id)) {
                const messageElement = createMessageElement(data.note);
                elements.messagesContainer.appendChild(messageElement);
                elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
            }
        }
        
        // Update pending notes if user is moderator
        if (['god', 'moderator'].includes(currentUserRole)) {
            loadPendingNotes();
        }
    });
    
    // Listen for note approvals
    socket.on('hierarchical-note-approved', (data) => {
        console.log('[HIERARCHICAL-NOTE] Note approved:', data);
        showStatus('A note has been approved', 'success');
        
        // Update pending notes if user is moderator
        if (['god', 'moderator'].includes(currentUserRole)) {
            loadPendingNotes();
        }
    });
    
    // Listen for note rejections
    socket.on('hierarchical-note-rejected', (data) => {
        console.log('[HIERARCHICAL-NOTE] Note rejected:', data);
        showStatus('A note has been rejected', 'info');
        
        // Update pending notes if user is moderator
        if (['god', 'moderator'].includes(currentUserRole)) {
            loadPendingNotes();
        }
    });
    
    socket.on('connect_error', (error) => {
        console.error('[HIERARCHICAL-NOTE] WebSocket connection error:', error);
    });
    
    socket.on('disconnect', (reason) => {
        console.log('[HIERARCHICAL-NOTE] WebSocket disconnected:', reason);
    });
}

// Update user menu with current user info
function updateUserMenu() {
    console.log('[HIERARCHICAL-NOTE] Updating user menu');
    const userNameElement = document.getElementById('userName');
    if (userNameElement && currentUser) {
        userNameElement.textContent = currentUser.username || currentUser.displayName || 'User';
        console.log('[HIERARCHICAL-NOTE] User menu updated with:', currentUser.username);
    }
}

// Leave conference function
function leaveConference() {
    console.log('[HIERARCHICAL-NOTE] Leave conference function called');
    localStorage.removeItem('currentConference');
    localStorage.removeItem('conferenceId');
    window.location.href = 'dashboard.html';
}

// Setup event listeners
function setupEventListeners() {
    console.log('[HIERARCHICAL-NOTE] Setting up event listeners');
    
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
    
    // Refresh buttons
    elements.refreshParticipants.addEventListener('click', loadParticipants);
    elements.refreshPending.addEventListener('click', loadPendingNotes);
    
    // Return to conference button
    elements.returnToDashboard.addEventListener('click', goToConference);
    
    // Moderation panel button
    elements.moderatorToggle.addEventListener('click', goToModerationPanel);
    
    // Leave conference button
    const leaveConferenceBtn = document.querySelector('.leave-conference-btn');
    if (leaveConferenceBtn) {
        leaveConferenceBtn.addEventListener('click', leaveConference);
        console.log('[HIERARCHICAL-NOTE] Leave conference button event listener added');
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
    console.log('[HIERARCHICAL-NOTE] Showing loading overlay');
    elements.loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    console.log('[HIERARCHICAL-NOTE] Hiding loading overlay');
    elements.loadingOverlay.style.display = 'none';
}

function showStatus(message, type = 'info') {
    console.log('[HIERARCHICAL-NOTE] Showing status message:', message, 'Type:', type);
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = `status-message ${type} show`;
    
    setTimeout(() => {
        elements.statusMessage.classList.remove('show');
        console.log('[HIERARCHICAL-NOTE] Status message hidden');
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