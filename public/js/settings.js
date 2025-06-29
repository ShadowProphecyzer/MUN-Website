// Conference Settings Page JavaScript
let currentConference = null;
let currentUserId = null;
let currentUserEmail = null;
let isGodUser = false;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadConferenceData();
    setupEventListeners();
});

// Check authentication
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../public_access/login/login.html';
        return;
    }
    
    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            localStorage.removeItem('token');
            window.location.href = '../public_access/login/login.html';
            return;
        }
        
        const userData = await response.json();
        currentUserId = userData._id;
        currentUserEmail = userData.email;
        
        // Check if user is God
        const godEmail = await getGodEmail();
        isGodUser = godEmail && userData.email === godEmail;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '../public_access/login/login.html';
    }
}

// Get God email from environment
async function getGodEmail() {
    try {
        const response = await fetch('/api/auth/god-email');
        if (response.ok) {
            const data = await response.json();
            return data.godEmail;
        }
    } catch (error) {
        console.error('Error getting God email:', error);
    }
    return null;
}

// Load conference data
async function loadConferenceData() {
    const conferenceId = getConferenceIdFromUrl();
    if (!conferenceId) {
        alert('No conference ID found');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/conferences/${conferenceId}/settings`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 403) {
                alert('You do not have permission to access settings');
                window.location.href = 'conference.html';
                return;
            }
            throw new Error('Failed to load conference data');
        }
        
        const data = await response.json();
        currentConference = data;
        
        // Load conference info
        await loadConferenceInfo(conferenceId);
        
        // Populate settings form
        populateSettingsForm(data.settings);
        
        // Load participants
        await loadParticipants(conferenceId);
        
    } catch (error) {
        console.error('Error loading conference data:', error);
        alert('Failed to load conference data');
    }
}

// Load conference basic info
async function loadConferenceInfo(conferenceId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/conferences/${conferenceId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const conference = await response.json();
            document.getElementById('conferenceName').textContent = conference.name;
            document.getElementById('conferenceCode').textContent = conference.code;
        }
    } catch (error) {
        console.error('Error loading conference info:', error);
    }
}

// Populate settings form
function populateSettingsForm(settings) {
    document.getElementById('description').value = settings.description || '';
    document.getElementById('allowPublicJoin').checked = settings.allowPublicJoin || false;
    document.getElementById('requireApproval').checked = settings.requireApproval !== false;
    document.getElementById('maxParticipants').value = settings.maxParticipants || 100;
}

// Load participants
async function loadParticipants(conferenceId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/conferences/${conferenceId}/participants`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const participants = await response.json();
            displayParticipants(participants);
        }
    } catch (error) {
        console.error('Error loading participants:', error);
    }
}

// Display participants
function displayParticipants(participants) {
    const container = document.getElementById('participantsList');
    
    if (participants.length === 0) {
        container.innerHTML = '<p>No participants found</p>';
        return;
    }
    
    const participantsHtml = participants.map(participant => {
        const isOwner = participant.role === 'owner';
        const isGod = participant.role === 'god';
        const isCurrentUser = currentUserId === participant.user._id;
        const canChangeRole = !isOwner && !isGod && !isCurrentUser;
        
        return `
            <div class="participant-item">
                <div class="participant-info">
                    <div class="participant-name">${participant.user.username}</div>
                    <div class="participant-role">
                        <span class="role-badge role-${participant.role}">${participant.role}</span>
                        ${participant.country ? ` - ${participant.country}` : ''}
                    </div>
                </div>
                ${canChangeRole ? `
                    <button class="change-role-btn" onclick="openRoleModal('${participant.user._id}', '${participant.role}')">
                        Change Role
                    </button>
                ` : ''}
                ${isGod ? '<span class="god-protection">👑 Protected</span>' : ''}
            </div>
        `;
    }).join('');
    
    container.innerHTML = participantsHtml;
}

// Setup event listeners
function setupEventListeners() {
    // Settings form
    document.getElementById('settingsForm').addEventListener('submit', handleSettingsSubmit);
    
    // Role modal
    const modal = document.getElementById('roleModal');
    const closeBtn = document.querySelector('.close');
    const roleForm = document.getElementById('roleForm');
    
    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    roleForm.addEventListener('submit', handleRoleChange);
}

// Handle settings form submission
async function handleSettingsSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const settings = {
        description: formData.get('description'),
        allowPublicJoin: formData.get('allowPublicJoin') === 'on',
        requireApproval: formData.get('requireApproval') === 'on',
        maxParticipants: parseInt(formData.get('maxParticipants'))
    };
    
    try {
        const token = localStorage.getItem('token');
        const conferenceId = getConferenceIdFromUrl();
        
        const response = await fetch(`/api/conferences/${conferenceId}/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ settings })
        });
        
        if (response.ok) {
            alert('Settings updated successfully!');
        } else {
            const error = await response.json();
            alert(`Error: ${error.message}`);
        }
    } catch (error) {
        console.error('Error updating settings:', error);
        alert('Failed to update settings');
    }
}

// Open role change modal
function openRoleModal(userId, currentRole) {
    const modal = document.getElementById('roleModal');
    const roleSelect = document.getElementById('newRole');
    
    // Set current role
    roleSelect.value = currentRole;
    
    // Store user ID for form submission
    roleSelect.dataset.userId = userId;
    
    modal.style.display = 'block';
}

// Handle role change
async function handleRoleChange(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newRole = formData.get('newRole');
    const userId = document.getElementById('newRole').dataset.userId;
    
    try {
        const token = localStorage.getItem('token');
        const conferenceId = getConferenceIdFromUrl();
        
        const response = await fetch(`/api/conferences/${conferenceId}/role`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId, role: newRole })
        });
        
        if (response.ok) {
            alert('Role updated successfully!');
            document.getElementById('roleModal').style.display = 'none';
            await loadParticipants(conferenceId); // Refresh participants list
        } else {
            const error = await response.json();
            alert(`Error: ${error.message}`);
        }
    } catch (error) {
        console.error('Error updating role:', error);
        alert('Failed to update role');
    }
}

// Get conference ID from URL
function getConferenceIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Utility function to show loading state
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<p>Loading...</p>';
    }
}

// Utility function to show error state
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<p style="color: red;">Error: ${message}</p>`;
    }
} 