// Global variables
let currentUser = null;
let currentUserRole = null;
let currentConferenceId = null;
let conferenceCode = null;
let socket = null;
let participants = [];
let pendingNotes = [];

// Country list for delegates
const countryList = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
    'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
    'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon',
    'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
    'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor',
    'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland',
    'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea',
    'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq',
    'Ireland', 'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati',
    'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania',
    'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius',
    'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia',
    'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
    'Oman', 'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
    'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
    'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
    'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
    'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
    'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City',
    'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

// DOM elements
const elements = {
    // Access control
    accessDenied: document.getElementById('access-denied'),
    moderationInterface: document.getElementById('moderation-interface'),
    
    // Navigation
    returnToConference: document.getElementById('return-to-conference'),
    leaveConferenceBtn: document.getElementById('leaveConferenceBtn'),
    userName: document.getElementById('userName'),
    
    // Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Pending Notes
    pendingNotes: document.getElementById('pending-notes'),
    refreshPending: document.getElementById('refresh-pending'),
    
    // Participants
    participantsList: document.getElementById('participantsList'),
    refreshParticipants: document.getElementById('refresh-participants'),
    addParticipantInput: document.getElementById('addParticipantInput'),
    addRoleSelect: document.getElementById('addRoleSelect'),
    addCountrySelect: document.getElementById('addCountrySelect'),
    addParticipantBtn: document.getElementById('addParticipantBtn'),
    
    // Status
    statusMessage: document.getElementById('status-message'),
    
    // Modal
    rejectionModal: document.getElementById('rejection-modal'),
    closeRejectionModal: document.getElementById('close-rejection-modal'),
    rejectionReason: document.getElementById('rejection-reason'),
    confirmRejectBtn: document.getElementById('confirm-reject-btn'),
    cancelRejectBtn: document.getElementById('cancel-reject-btn'),
    
    // Loading
    loadingOverlay: document.getElementById('loading-overlay')
};

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('[MODERATION] Initializing moderation panel');
    
    // Check authentication and access
    await checkAuthAndAccess();
    
    if (currentUser && currentUserRole) {
        // Setup the interface
        setupInterface();
        setupEventListeners();
        initializeSocket();
        
        // Load initial data
        await loadInitialData();
    }
});

// Check authentication and access control
async function checkAuthAndAccess() {
    try {
        console.log('[MODERATION] Checking authentication and access');
        
        // Check if user is authenticated
        const authResponse = await fetch('/api/auth/check', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!authResponse.ok) {
            throw new Error('Authentication failed');
        }
        
        const authData = await authResponse.json();
        currentUser = authData.user;
        
        // Get conference code from URL
        conferenceCode = getConferenceCodeFromURL();
        if (!conferenceCode) {
            throw new Error('No conference code found');
        }
        
        // Get user's role in this conference
        const participantsResponse = await fetch(`/api/participants/${conferenceCode}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!participantsResponse.ok) {
            throw new Error('Failed to get participant data');
        }
        
        const participantsData = await participantsResponse.json();
        const currentParticipant = participantsData.data.find(p => p.email === currentUser.email);
        
        if (!currentParticipant) {
            throw new Error('User not found in conference');
        }
        
        currentUserRole = currentParticipant.role.toLowerCase();
        
        // Check if user has moderation access
        if (!['god', 'moderator'].includes(currentUserRole)) {
            console.log('[MODERATION] Access denied - user role:', currentUserRole);
            showAccessDenied();
            return;
        }
        
        console.log('[MODERATION] Access granted - user role:', currentUserRole);
        showModerationInterface();
        
    } catch (error) {
        console.error('[MODERATION] Authentication/access error:', error);
        showAccessDenied();
    }
}

// Show access denied message
function showAccessDenied() {
    elements.accessDenied.style.display = 'flex';
    elements.moderationInterface.style.display = 'none';
}

// Show moderation interface
function showModerationInterface() {
    elements.accessDenied.style.display = 'none';
    elements.moderationInterface.style.display = 'block';
}

// Setup the interface
function setupInterface() {
    console.log('[MODERATION] Setting up interface');
    
    // Update user info
    if (elements.userName && currentUser) {
        elements.userName.textContent = currentUser.username || currentUser.displayName || 'User';
    }
    
    // Populate country dropdown
    if (elements.addCountrySelect) {
        elements.addCountrySelect.innerHTML = '<option value="">Select Country</option>' + 
            countryList.map(c => `<option value="${c}">${c}</option>`).join('');
    }
}

// Setup event listeners
function setupEventListeners() {
    console.log('[MODERATION] Setting up event listeners');
    
    // Navigation
    elements.returnToConference.addEventListener('click', () => {
        window.location.href = `conference.html?code=${conferenceCode}`;
    });
    
    elements.leaveConferenceBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to leave this conference?')) {
            window.location.href = 'dashboard.html';
        }
    });
    
    // Tab switching
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // Refresh buttons
    elements.refreshPending.addEventListener('click', loadPendingNotes);
    elements.refreshParticipants.addEventListener('click', loadParticipants);
    
    // Add participant
    elements.addParticipantBtn.addEventListener('click', addParticipant);
    
    // Role selection change
    elements.addRoleSelect.addEventListener('change', function() {
        if (this.value === 'delegate') {
            elements.addCountrySelect.style.display = '';
        } else {
            elements.addCountrySelect.style.display = 'none';
            elements.addCountrySelect.value = '';
        }
    });
    
    // Modal events
    elements.closeRejectionModal.addEventListener('click', closeRejectionModal);
    elements.cancelRejectBtn.addEventListener('click', closeRejectionModal);
    elements.confirmRejectBtn.addEventListener('click', confirmReject);
    
    // Close modal on outside click
    elements.rejectionModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeRejectionModal();
        }
    });
}

// Switch between tabs
function switchTab(tabName) {
    console.log('[MODERATION] Switching to tab:', tabName);
    
    // Update tab buttons
    elements.tabBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Update tab content
    elements.tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabName}-tab`) {
            content.classList.add('active');
        }
    });
    
    // Load data for the selected tab
    if (tabName === 'pending-notes') {
        loadPendingNotes();
    } else if (tabName === 'participants') {
        loadParticipants();
    }
}

// Load initial data
async function loadInitialData() {
    console.log('[MODERATION] Loading initial data');
    await loadPendingNotes();
    await loadParticipants();
}

// Load pending notes
async function loadPendingNotes() {
    console.log('[MODERATION] Loading pending notes');
    try {
        showLoading();
        
        const response = await fetch(`/api/hierarchical-notes/pending/${conferenceCode}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load pending notes');
        }
        
        const data = await response.json();
        pendingNotes = data.notes || [];
        renderPendingNotes();
        
    } catch (error) {
        console.error('[MODERATION] Error loading pending notes:', error);
        showStatus('Error loading pending notes', 'error');
    } finally {
        hideLoading();
    }
}

// Render pending notes
function renderPendingNotes() {
    console.log('[MODERATION] Rendering pending notes, count:', pendingNotes.length);
    elements.pendingNotes.innerHTML = '';
    
    if (pendingNotes.length === 0) {
        elements.pendingNotes.innerHTML = '<p style="text-align: center; color: #cba135; padding: 20px;">No pending notes</p>';
        return;
    }
    
    pendingNotes.forEach(note => {
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
}

// Load participants
async function loadParticipants() {
    console.log('[MODERATION] Loading participants');
    try {
        const response = await fetch(`/api/participants/${conferenceCode}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load participants');
        }
        
        const data = await response.json();
        participants = data.data || [];
        renderParticipants();
        
    } catch (error) {
        console.error('[MODERATION] Error loading participants:', error);
        showStatus('Error loading participants', 'error');
    }
}

// Render participants
function renderParticipants() {
    console.log('[MODERATION] Rendering participants, count:', participants.length);
    elements.participantsList.innerHTML = '';
    
    if (participants.length === 0) {
        elements.participantsList.innerHTML = '<p style="text-align: center; color: #cba135; padding: 20px;">No participants found</p>';
        return;
    }
    
    // Sort participants (GOD and Owner first)
    const sorted = [...participants].sort((a, b) => {
        if (a.role === 'GOD') return -1;
        if (b.role === 'GOD') return 1;
        if (a.role === 'Owner') return -1;
        if (b.role === 'Owner') return 1;
        return 0;
    });
    
    sorted.forEach(p => {
        let roleLabel = p.role.charAt(0).toUpperCase() + p.role.slice(1);
        if (p.role.toLowerCase() === 'delegate') {
            if (p.country && p.country.trim() !== '') {
                roleLabel = `Delegate of '${p.country}'`;
            }
        }
        
        const li = document.createElement('li');
        li.className = 'participant-item';
        li.innerHTML = `
            <div class="participant-avatar">${p.name[0].toUpperCase()}</div>
            <div class="participant-info">
                <div class="participant-name">${p.name}</div>
                <div class="participant-email">${p.email}</div>
            </div>
            <span class="role-label">${roleLabel}</span>
            <button class="remove-btn ${canRemove(p) ? '' : 'disabled'}" data-email="${p.email}" ${canRemove(p) ? '' : 'disabled'}>&times;</button>
        `;
        
        // Add remove functionality
        const removeBtn = li.querySelector('.remove-btn');
        if (removeBtn && canRemove(p)) {
            removeBtn.addEventListener('click', () => removeParticipant(p.email));
        }
        
        elements.participantsList.appendChild(li);
    });
}

// Check if current user can remove a participant
function canRemove(p) {
    if (!currentUserRole) return false;
    if (p.isLocked) return false;
    if (['god', 'owner'].includes(currentUserRole)) return true;
    if (currentUserRole === 'administrator') {
        return !['god', 'owner', 'administrator'].includes(p.role.toLowerCase());
    }
    return false;
}

// Add participant
async function addParticipant() {
    const email = elements.addParticipantInput.value.trim();
    const role = elements.addRoleSelect.value;
    const country = elements.addCountrySelect.value;
    
    if (!email) {
        showStatus('Please enter an email address', 'error');
        return;
    }
    
    if (role === 'delegate' && !country) {
        showStatus('Please select a country for the delegate', 'error');
        return;
    }
    
    if (!confirm(`Add ${email} as ${role}${role === 'delegate' ? ` of '${country}'` : ''}?`)) {
        return;
    }
    
    try {
        showLoading();
        
        const body = { email, role };
        if (role === 'delegate') body.country = country;
        
        const response = await fetch(`/api/participants/${conferenceCode}/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to add participant');
        }
        
        showStatus('Participant added successfully', 'success');
        elements.addParticipantInput.value = '';
        elements.addRoleSelect.value = 'unassigned';
        elements.addCountrySelect.value = '';
        elements.addCountrySelect.style.display = 'none';
        
        await loadParticipants();
        
    } catch (error) {
        console.error('[MODERATION] Error adding participant:', error);
        showStatus(error.message || 'Error adding participant', 'error');
    } finally {
        hideLoading();
    }
}

// Remove participant
async function removeParticipant(email) {
    if (!confirm(`Remove ${email} from the conference?`)) {
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`/api/participants/${conferenceCode}/remove`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to remove participant');
        }
        
        showStatus('Participant removed successfully', 'success');
        await loadParticipants();
        
    } catch (error) {
        console.error('[MODERATION] Error removing participant:', error);
        showStatus(error.message || 'Error removing participant', 'error');
    } finally {
        hideLoading();
    }
}

// Lock note for moderation
async function lockNote(noteId) {
    console.log('[MODERATION] Locking note:', noteId);
    try {
        const response = await fetch(`/api/hierarchical-notes/lock/${noteId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to lock note');
        }
        
        showStatus('Note locked successfully', 'success');
        await loadPendingNotes();
        
    } catch (error) {
        console.error('[MODERATION] Error locking note:', error);
        showStatus(error.message || 'Error locking note', 'error');
    }
}

// Approve note
async function approveNote(noteId) {
    if (!confirm('Approve this note?')) {
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`/api/hierarchical-notes/approve/${noteId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to approve note');
        }
        
        showStatus('Note approved successfully', 'success');
        await loadPendingNotes();
        
    } catch (error) {
        console.error('[MODERATION] Error approving note:', error);
        showStatus(error.message || 'Error approving note', 'error');
    } finally {
        hideLoading();
    }
}

// Reject note
async function rejectNote(noteId) {
    elements.rejectionModal.style.display = 'flex';
    elements.rejectionReason.value = '';
    elements.rejectionReason.focus();
    
    // Store the note ID for the confirmation
    elements.rejectionModal.dataset.noteId = noteId;
}

// Close rejection modal
function closeRejectionModal() {
    elements.rejectionModal.style.display = 'none';
    elements.rejectionModal.dataset.noteId = '';
}

// Confirm reject
async function confirmReject() {
    const noteId = elements.rejectionModal.dataset.noteId;
    const reason = elements.rejectionReason.value.trim();
    
    if (!reason) {
        showStatus('Please provide a rejection reason', 'error');
        return;
    }
    
    try {
        showLoading();
        closeRejectionModal();
        
        const response = await fetch(`/api/hierarchical-notes/reject/${noteId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ reason })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to reject note');
        }
        
        showStatus('Note rejected successfully', 'success');
        await loadPendingNotes();
        
    } catch (error) {
        console.error('[MODERATION] Error rejecting note:', error);
        showStatus(error.message || 'Error rejecting note', 'error');
    } finally {
        hideLoading();
    }
}

// Initialize WebSocket connection
function initializeSocket() {
    console.log('[MODERATION] Initializing WebSocket connection');
    
    if (typeof io === 'undefined') {
        console.warn('[MODERATION] Socket.IO not available, real-time updates disabled');
        return;
    }
    
    socket = io();
    console.log('[MODERATION] Socket.io instance created');
    
    // Join conference room
    socket.emit('join-conference', conferenceCode);
    console.log('[MODERATION] Joined conference room:', conferenceCode);
    
    // Listen for note updates
    socket.on('hierarchical-note-created', (data) => {
        console.log('[MODERATION] New note received:', data);
        loadPendingNotes();
    });
    
    socket.on('hierarchical-note-approved', (data) => {
        console.log('[MODERATION] Note approved:', data);
        showStatus('A note has been approved', 'success');
        loadPendingNotes();
    });
    
    socket.on('hierarchical-note-rejected', (data) => {
        console.log('[MODERATION] Note rejected:', data);
        showStatus('A note has been rejected', 'info');
        loadPendingNotes();
    });
    
    // Listen for participant updates
    socket.on('participantsUpdate', () => {
        console.log('[MODERATION] Participants updated');
        loadParticipants();
    });
    
    socket.on('connect_error', (error) => {
        console.error('[MODERATION] WebSocket connection error:', error);
    });
    
    socket.on('disconnect', (reason) => {
        console.log('[MODERATION] WebSocket disconnected:', reason);
    });
}

// Utility functions
function getConferenceCodeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('code');
}

function showLoading() {
    elements.loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    elements.loadingOverlay.style.display = 'none';
}

function showStatus(message, type = 'info') {
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = `status-message ${type}`;
    elements.statusMessage.style.display = 'block';
    
    setTimeout(() => {
        elements.statusMessage.style.display = 'none';
    }, 4000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
} 