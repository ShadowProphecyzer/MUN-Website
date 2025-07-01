// DOM Elements
const loadingOverlay = document.getElementById('loadingOverlay');
const errorContainer = document.getElementById('errorContainer');
const successContainer = document.getElementById('successContainer');
const logoutBtn = document.getElementById('logoutBtn');
const backToDashboardBtn = document.getElementById('backToDashboardBtn');
const createAnotherBtn = document.getElementById('createAnotherBtn');
const copyCodeBtn = document.getElementById('copyCodeBtn');

// Conference data elements
const conferenceName = document.getElementById('conferenceName');
const committeeName = document.getElementById('committeeName');
const committeeIssue = document.getElementById('committeeIssue');
const conferenceCode = document.getElementById('conferenceCode');
const createdBy = document.getElementById('createdBy');
const createdOn = document.getElementById('createdOn');

// --- People System ---
let socket;
let currentUserId = null;
let currentUserRole = null;
let peopleList = [];

const detailsTabBtn = document.getElementById('detailsTabBtn');
const peopleTabBtn = document.getElementById('peopleTabBtn');
const detailsTab = document.getElementById('detailsTab');
const peopleTab = document.getElementById('peopleTab');
const addPersonBtn = document.getElementById('addPersonBtn');
const peopleListContainer = document.getElementById('peopleListContainer');
const personModal = document.getElementById('personModal');
const personForm = document.getElementById('personForm');
const personModalTitle = document.getElementById('personModalTitle');
const personEmail = document.getElementById('personEmail');
const personRole = document.getElementById('personRole');
const personCountry = document.getElementById('personCountry');
const countryGroup = document.getElementById('countryGroup');
const countryDropdown = document.getElementById('countryDropdown');
const cancelPersonBtn = document.getElementById('cancelPersonBtn');
const submitPersonBtn = document.getElementById('submitPersonBtn');

const UN_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Cote d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

// --- Chat Tab Logic ---
const chatTabBtn = document.getElementById('chatTabBtn');
const chatTab = document.getElementById('chatTab');
const chatSidebar = document.getElementById('chatSidebar');
const chatWindow = document.getElementById('chatWindow');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatBell = document.getElementById('chatBell');
const chatNotifCount = document.getElementById('chatNotifCount');
const moderatorPanel = document.getElementById('moderatorPanel');
const pendingMessagesDiv = document.getElementById('pendingMessages');

let currentUser = null;
let selectedUserId = null;
let pendingMessages = [];
let unreadCount = 0;
let isModerator = false;

// --- Amendments Tab Logic ---
const amendmentsTabBtn = document.getElementById('amendmentsTabBtn');
const amendmentsTab = document.getElementById('amendmentsTab');
const amendmentsList = document.getElementById('amendmentsList');
const amendmentForm = document.getElementById('amendmentForm');
const amendmentBell = document.getElementById('amendmentBell');
const amendmentNotifCount = document.getElementById('amendmentNotifCount');
const cancelAmendment = document.getElementById('cancelAmendment');

let amendments = [];
let amendmentUnreadCount = 0;

// --- Voting Tab Logic ---
const votingTabBtn = document.getElementById('votingTabBtn');
const votingTab = document.getElementById('votingTab');
const votingMenu = document.getElementById('votingMenu');
const votingResults = document.getElementById('votingResults');
const votingBell = document.getElementById('votingBell');
const votingNotifCount = document.getElementById('votingNotifCount');

let votingSession = null;
let votingUnreadCount = 0;
let voteConfirmation = '';

// --- Contributions Tab Logic ---
const contributionsTabBtn = document.getElementById('contributionsTabBtn');
const contributionsTab = document.getElementById('contributionsTab');
const contributionsTableDiv = document.getElementById('contributionsTable');
const awardsCardsDiv = document.getElementById('awardsCards');

let contributions = [];
let awards = {};
let contributionCooldowns = {}; // { delegateId_field: timestamp }
let awardConfirmations = { bestDelegate: '', honourableMention: '', bestPositionPaper: '' };

// --- Conference Report Tab Logic ---
const reportTabBtn = document.getElementById('reportTabBtn');
const reportTab = document.getElementById('reportTab');
const reportSection = document.getElementById('reportSection');

const reportTypes = [
  { type: 'people', label: 'People Report' },
  { type: 'amendments', label: 'Amendments Report' },
  { type: 'chat', label: 'Chat Log Report' },
  { type: 'voting', label: 'Voting Report' },
  { type: 'contributions', label: 'Contributions Report' },
  { type: 'awards', label: 'Awards Report' }
];

let reportLinks = {};

// Get conference code from URL parameters
function getConferenceCode() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('code');
}

// Load conference details on page load
document.addEventListener('DOMContentLoaded', function() {
    const code = getConferenceCode();
    if (code) {
        loadConferenceDetails(code);
    } else {
        showError('No conference code provided.');
    }
});

// Load conference details from server
async function loadConferenceDetails(code) {
    try {
        const response = await fetch(`/api/conference/${code}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            displayConferenceData(data.data.conference);
        } else {
            showError(data.message || 'Failed to load conference details.');
        }
    } catch (error) {
        console.error('Error loading conference:', error);
        showError('Network error. Please try again.');
    }
}

// Display conference data
function displayConferenceData(conference) {
    try {
        // Set conference name
        conferenceName.textContent = conference.conferenceName;
        
        // Set committee name
        committeeName.textContent = conference.committeeName;
        
        // Set committee issue
        committeeIssue.textContent = conference.committeeIssue;
        
        // Set conference code
        conferenceCode.textContent = conference.conferenceCode;
        
        // Set created by
        createdBy.textContent = conference.creator.username;
        
        // Set created on date
        if (conference.createdAt) {
            const createdDate = new Date(conference.createdAt);
            createdOn.textContent = createdDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } else {
            createdOn.textContent = 'N/A';
        }
        
        // Hide loading overlay
        loadingOverlay.style.display = 'none';
        
    } catch (error) {
        console.error('Error displaying conference data:', error);
        showError('Failed to display conference data. Please try again.');
    }
}

// Show error message
function showError(message) {
    loadingOverlay.style.display = 'none';
    errorContainer.style.display = 'flex';
    
    const errorMessage = errorContainer.querySelector('.error-message p');
    if (errorMessage) {
        errorMessage.textContent = message;
    }
}

// Copy conference code to clipboard
copyCodeBtn.addEventListener('click', async function() {
    const code = conferenceCode.textContent;
    
    try {
        await navigator.clipboard.writeText(code);
        showSuccess('Conference code copied to clipboard!');
    } catch (error) {
        console.error('Failed to copy code:', error);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showSuccess('Conference code copied to clipboard!');
    }
});

// Show success message
function showSuccess(message) {
    const successMessage = successContainer.querySelector('.success-message p');
    if (successMessage) {
        successMessage.textContent = message;
    }
    
    successContainer.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
        successContainer.style.display = 'none';
    }, 3000);
}

// Back to dashboard button
backToDashboardBtn.addEventListener('click', function() {
    window.location.href = 'dashboard.html';
});

// Create another conference button
createAnotherBtn.addEventListener('click', function() {
    window.location.href = 'dashboard.html';
});

// Logout functionality
logoutBtn.addEventListener('click', function(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('authToken');
    
    if (token) {
        // Call logout endpoint
        fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .catch(error => {
            console.error('Logout error:', error);
        })
        .finally(() => {
            // Clear local storage regardless of server response
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            
            // Redirect to signin page
            window.location.href = 'signin_signup.html';
        });
    } else {
        // If no token, just redirect
        window.location.href = 'signin_signup.html';
    }
});

// Add event listeners for navigation
document.addEventListener('DOMContentLoaded', function() {
    // Add click event to MUN logo to go to homepage
    const munLogo = document.querySelector('.mun-logo');
    if (munLogo) {
        munLogo.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'homepage.html';
        });
    }
    
    // Add click event to dashboard link
    const dashboardLink = document.querySelector('.dashboard-link');
    if (dashboardLink) {
        dashboardLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'dashboard.html';
        });
    }
    
    // Add click event to profile link
    const profileLink = document.querySelector('.profile-link');
    if (profileLink) {
        profileLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'profile.html';
        });
    }
});

// Handle page visibility change (when user switches tabs)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Check if we need to refresh conference data
        const code = getConferenceCode();
        if (code) {
            // Could add refresh logic here if needed
        }
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + L for logout
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        logoutBtn.click();
    }
    
    // Escape key to go back to dashboard
    if (e.key === 'Escape') {
        backToDashboardBtn.click();
    }
    
    // Ctrl/Cmd + C to copy conference code
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        copyCodeBtn.click();
    }
});

// Tab switching
if (detailsTabBtn && peopleTabBtn && detailsTab && peopleTab) {
    detailsTabBtn.addEventListener('click', () => {
        detailsTabBtn.classList.add('active');
        peopleTabBtn.classList.remove('active');
        detailsTab.style.display = 'block';
        peopleTab.style.display = 'none';
    });
    peopleTabBtn.addEventListener('click', () => {
        detailsTabBtn.classList.remove('active');
        peopleTabBtn.classList.add('active');
        detailsTab.style.display = 'none';
        peopleTab.style.display = 'block';
        if (peopleList.length === 0) fetchPeopleList();
    });
}

// Socket.IO setup
function setupSocket() {
    if (typeof io === 'undefined') return;
    socket = io();
    socket.emit('joinConference', conferenceCode);
    socket.on('peopleUpdate', (people) => {
        peopleList = people;
        renderPeopleList();
    });
}

// Fetch current user info and people list
async function fetchPeopleList() {
    conferenceCode = getConferenceCode();
    if (!conferenceCode) return;
    // Get current user info
    const token = getAuthToken();
    const meRes = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
    const meData = await meRes.json();
    if (meData.success && meData.data && meData.data.user) {
        currentUserId = meData.data.user.id;
    }
    // Get people list
    const res = await fetch(`/api/conference/${conferenceCode}/people`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) {
        peopleList = data.data.people;
        // Find current user's role
        const me = peopleList.find(p => p.userId === currentUserId);
        currentUserRole = me ? me.role : null;
        renderPeopleList();
        setupSocket();
        // Show add button if allowed
        if (["god", "owner", "admin"].includes(currentUserRole)) {
            addPersonBtn.style.display = '';
        } else {
            addPersonBtn.style.display = 'none';
        }
    } else {
        peopleListContainer.innerHTML = `<div class='error-message'>${data.message || 'Access denied.'}</div>`;
    }
}

// Render people list
function renderPeopleList() {
    if (!Array.isArray(peopleList)) return;
    let html = `<table class='people-table'><thead><tr><th>Email</th><th>Role</th><th>Country</th><th>Actions</th></tr></thead><tbody>`;
    for (const person of peopleList) {
        html += `<tr>
            <td>${person.email}</td>
            <td><span class="role-badge ${person.role}">${person.role}</span></td>
            <td>${person.role === 'delegate' ? (person.country || '-') : '-'}</td>
            <td class='people-actions'>`;
        // Only show actions if allowed
        if (canEditPerson(person)) {
            html += `<button class='edit-btn' onclick='editPerson("${person.userId}")'>Edit</button>`;
        }
        if (canRemovePerson(person)) {
            html += `<button class='remove-btn' onclick='removePerson("${person.userId}")'>Remove</button>`;
        }
        html += `</td></tr>`;
    }
    html += `</tbody></table>`;
    peopleListContainer.innerHTML = html;
}

// Role-based permissions
function canEditPerson(person) {
    if (!currentUserRole) return false;
    if (["god", "owner"].includes(currentUserRole)) {
        return !["god", "owner"].includes(person.role);
    }
    if (currentUserRole === "admin") {
        return ["delegate", "chair", "moderator"].includes(person.role);
    }
    return false;
}
function canRemovePerson(person) {
    if (!currentUserRole) return false;
    if (["god", "owner"].includes(currentUserRole)) {
        return !["god", "owner"].includes(person.role);
    }
    if (currentUserRole === "admin") {
        return ["delegate", "chair", "moderator"].includes(person.role);
    }
    return false;
}

// Add/Edit Person Modal logic
let editingUserId = null;
if (addPersonBtn) {
    addPersonBtn.addEventListener('click', () => openPersonModal());
}
if (cancelPersonBtn) {
    cancelPersonBtn.addEventListener('click', closePersonModal);
}
personRole.addEventListener('change', () => {
    if (personRole.value === 'delegate') {
        countryGroup.style.display = '';
    } else {
        countryGroup.style.display = 'none';
        personCountry.value = '';
    }
});
personCountry.addEventListener('input', handleCountrySearch);

function openPersonModal(person = null) {
    editingUserId = person ? person.userId : null;
    personModalTitle.textContent = editingUserId ? 'Edit Person' : 'Add Person';
    personEmail.value = person ? person.email : '';
    personEmail.disabled = !!editingUserId;
    personRole.value = person ? person.role : 'delegate';
    if (personRole.value === 'delegate') {
        countryGroup.style.display = '';
        personCountry.value = person.country || '';
    } else {
        countryGroup.style.display = 'none';
        personCountry.value = '';
    }
    clearPersonErrors();
    personModal.style.display = 'flex';
}
function closePersonModal() {
    personModal.style.display = 'none';
    editingUserId = null;
    personForm.reset();
    clearPersonErrors();
}
function clearPersonErrors() {
    document.getElementById('personEmailError').textContent = '';
    document.getElementById('personRoleError').textContent = '';
    document.getElementById('personCountryError').textContent = '';
}

// Add/Edit Person submit
personForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    clearPersonErrors();
    const email = personEmail.value.trim();
    const role = personRole.value;
    const country = personRole.value === 'delegate' ? personCountry.value.trim() : '';
    if (!email) {
        document.getElementById('personEmailError').textContent = 'Email is required.';
        return;
    }
    if (!role) {
        document.getElementById('personRoleError').textContent = 'Role is required.';
        return;
    }
    if (role === 'delegate' && !country) {
        document.getElementById('personCountryError').textContent = 'Country is required for delegates.';
        return;
    }
    const token = getAuthToken();
    try {
        if (editingUserId) {
            // Edit
            const res = await fetch(`/api/conference/${conferenceCode}/people/${editingUserId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ role, country })
            });
            const data = await res.json();
            if (!data.success) {
                document.getElementById('personEmailError').textContent = data.message || 'Failed to update user.';
                return;
            }
        } else {
            // Add
            const res = await fetch(`/api/conference/${conferenceCode}/people`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ email, role, country })
            });
            const data = await res.json();
            if (!data.success) {
                document.getElementById('personEmailError').textContent = data.message || 'Failed to add user.';
                return;
            }
        }
        closePersonModal();
    } catch (error) {
        document.getElementById('personEmailError').textContent = 'Network error.';
    }
});

// Edit/Remove handlers (global for table)
window.editPerson = function(userId) {
    const person = peopleList.find(p => p.userId === userId);
    if (person) openPersonModal(person);
};
window.removePerson = async function(userId) {
    if (!confirm('Are you sure you want to remove this user?')) return;
    const token = getAuthToken();
    try {
        const res = await fetch(`/api/conference/${conferenceCode}/people/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) {
            alert(data.message || 'Failed to remove user.');
        }
    } catch (error) {
        alert('Network error.');
    }
};

// Country dropdown logic
function handleCountrySearch() {
    const query = personCountry.value.trim().toLowerCase();
    if (!query) {
        countryDropdown.innerHTML = '';
        countryDropdown.classList.remove('active');
        return;
    }
    const matches = UN_COUNTRIES.filter(c => c.toLowerCase().includes(query));
    if (matches.length === 0) {
        countryDropdown.innerHTML = '<div class="dropdown-item">No matches</div>';
        countryDropdown.classList.add('active');
        return;
    }
    countryDropdown.innerHTML = matches.map(c => `<div class="dropdown-item">${c}</div>`).join('');
    countryDropdown.classList.add('active');
    Array.from(countryDropdown.children).forEach(item => {
        item.addEventListener('click', () => {
            personCountry.value = item.textContent;
            countryDropdown.classList.remove('active');
        });
    });
}
document.addEventListener('click', function(e) {
    if (!countryGroup.contains(e.target)) {
        countryDropdown.classList.remove('active');
    }
});

// Initial load
if (peopleTabBtn) {
    peopleTabBtn.addEventListener('click', fetchPeopleList);
}

// --- Chat Tab Logic ---
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    tab.style.display = '';
}

chatTabBtn.addEventListener('click', () => {
    switchTab(chatTab);
    chatTabBtn.classList.add('active');
    unreadCount = 0;
    chatNotifCount.style.display = 'none';
});

// --- Socket.IO Setup ---
function setupSocket() {
    socket = io();
    socket.on('connect', () => {
        socket.emit('joinConference', conferenceCode, currentUser._id);
    });
    socket.on('chatMessage', (msg) => {
        if (msg.conferenceCode === conferenceCode) {
            if (msg.to === currentUser._id || msg.from === currentUser._id) {
                addMessageToChat(msg);
                if (document.getElementById('chatTab').style.display === 'none') {
                    unreadCount++;
                    chatNotifCount.textContent = unreadCount;
                    chatNotifCount.style.display = '';
                }
            }
        }
    });
    socket.on('pendingMessage', (msg) => {
        if (isModerator) {
            addPendingMessage(msg);
        }
    });
    socket.on('messageApproved', (msg) => {
        if (msg.to === currentUser._id || msg.from === currentUser._id) {
            addMessageToChat(msg);
        }
    });
    socket.on('messageDenied', (msg) => {
        if (msg.from === currentUser._id || isModerator) {
            addDeniedMessage(msg);
        }
    });
}

// --- Fetch People ---
async function fetchPeople() {
    const res = await fetch(`/api/conference/${conferenceCode}/people`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    peopleList = data.people;
    renderPeopleSidebar();
    isModerator = ['God','Owner','Admin','Moderator'].includes(currentUser.role);
    if (isModerator) {
        moderatorPanel.style.display = '';
        fetchPendingMessages();
    }
}

function renderPeopleSidebar() {
    chatSidebar.innerHTML = '';
    peopleList.forEach(person => {
        if (person._id === currentUser._id) return;
        const div = document.createElement('div');
        div.className = 'chat-user' + (selectedUserId === person._id ? ' active' : '');
        div.textContent = `${person.username} (${person.role})`;
        div.onclick = () => {
            selectedUserId = person._id;
            renderPeopleSidebar();
            fetchChatHistory(selectedUserId);
        };
        chatSidebar.appendChild(div);
    });
}

// --- Chat History ---
async function fetchChatHistory(userId) {
    chatMessages.innerHTML = '<div class="loading">Loading...</div>';
    const res = await fetch(`/api/conference/${conferenceCode}/chat/history/${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    chatMessages.innerHTML = '';
    data.messages.forEach(addMessageToChat);
}

function addMessageToChat(msg) {
    const div = document.createElement('div');
    div.className = 'chat-message ' + (msg.from === currentUser._id ? 'sent' : 'received');
    div.innerHTML = `<div class="msg-content">${msg.content}${msg.status==='denied'?'<span class="denied"> (Denied)</span>':''}</div>
        <div class="msg-meta">${msg.fromUsername} • ${new Date(msg.createdAt).toLocaleTimeString()}</div>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addDeniedMessage(msg) {
    const div = document.createElement('div');
    div.className = 'chat-message sent';
    div.innerHTML = `<div class="msg-content denied">${msg.content} <span class="denied">(Denied: ${msg.denyReason})</span></div>
        <div class="msg-meta">${msg.fromUsername} • ${new Date(msg.createdAt).toLocaleTimeString()}</div>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Send Message ---
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    const content = chatInput.value.trim();
    if (!content) return;
    const res = await fetch(`/api/conference/${conferenceCode}/chat/send`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ to: selectedUserId, content })
    });
    const data = await res.json();
    if (data.status === 'pending') {
        addMessageToChat({ ...data.message, from: currentUser._id, fromUsername: currentUser.username });
    }
    chatInput.value = '';
});

// --- Moderator Panel ---
async function fetchPendingMessages() {
    const res = await fetch(`/api/conference/${conferenceCode}/chat/pending`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    pendingMessages = data.messages;
    renderPendingMessages();
}

function addPendingMessage(msg) {
    pendingMessages.push(msg);
    renderPendingMessages();
}

function renderPendingMessages() {
    pendingMessagesDiv.innerHTML = '';
    pendingMessages.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'pending-message';
        div.innerHTML = `<div class="pending-meta">From: ${msg.fromUsername} → To: ${msg.toUsername}</div>
            <div class="msg-content">${msg.content}</div>
            <div class="pending-actions">
                <button class="approve">Approve</button>
                <button class="deny">Deny</button>
            </div>`;
        div.querySelector('.approve').onclick = () => moderateMessage(msg._id, true);
        div.querySelector('.deny').onclick = () => {
            const reason = prompt('Reason for denial?');
            if (reason) moderateMessage(msg._id, false, reason);
        };
        pendingMessagesDiv.appendChild(div);
    });
}

async function moderateMessage(msgId, approve, reason) {
    const res = await fetch(`/api/conference/${conferenceCode}/chat/moderate/${msgId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ approve, reason })
    });
    if (res.ok) {
        pendingMessages = pendingMessages.filter(m => m._id !== msgId);
        renderPendingMessages();
    }
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    currentUser = getCurrentUser();
    conferenceCode = getConferenceCode();
    if (!currentUser || !conferenceCode) return;
    setupSocket();
    fetchPeople();
});

// Utility: get user info from localStorage/session (assume JWT or user object is stored)
function getCurrentUser() {
    // Example: { _id, username, role, ... }
    return JSON.parse(localStorage.getItem('user'));
}

// Utility: get auth token from localStorage/session (assume JWT or token is stored)
function getAuthToken() {
    // Example: 'Bearer <token>'
    return localStorage.getItem('authToken');
}

amendmentsTabBtn.addEventListener('click', () => {
  switchTab(amendmentsTab);
  amendmentsTabBtn.classList.add('active');
  amendmentUnreadCount = 0;
  amendmentNotifCount.style.display = 'none';
});

function canSubmitAmendment() {
  return ['God','Owner','Admin','Delegate'].includes(currentUser.role);
}
function canChangeAmendmentStatus() {
  return currentUser.role === 'Chair';
}

function showAmendmentForm(show) {
  amendmentForm.style.display = show ? '' : 'none';
}

function renderAmendments() {
  amendmentsList.innerHTML = '';
  amendments.forEach(amendment => {
    const div = document.createElement('div');
    div.className = `amendment-item ${amendment.status}`;
    let submitter = amendment.country;
    if (amendment.submitterRole && amendment.submitterRole !== 'Delegate') {
      submitter = `${amendment.submitterRole}`;
    }
    div.innerHTML = `
      <div class="amendment-meta">
        <b>#${amendment.amendmentNumber}</b> | Resolution: ${amendment.resolutionNumber}, Clause: ${amendment.clauseNumber}${amendment.subclause ? '-' + amendment.subclause : ''}${amendment.subSubClause && amendment.subSubClause !== 'N/A' ? '-' + amendment.subSubClause : ''} | Type: ${amendment.type} | By: ${submitter}
      </div>
      <div class="amendment-content">${amendment.content}</div>
      <div class="amendment-status">Status: ${amendment.status.replace('-', ' ').toUpperCase()}${amendment.statusChangedBy ? ` (by ${amendment.statusChangedBy})` : ''}</div>
      ${canChangeAmendmentStatus() ? `
      <div class="amendment-actions">
        <button class="pass">Pass</button>
        <button class="reject">Reject</button>
        <button class="in-debate">In-Debate</button>
      </div>` : ''}
    `;
    if (canChangeAmendmentStatus()) {
      const [passBtn, rejectBtn, inDebateBtn] = div.querySelectorAll('.amendment-actions button');
      passBtn.onclick = () => changeAmendmentStatus(amendment._id, 'passed');
      rejectBtn.onclick = () => changeAmendmentStatus(amendment._id, 'rejected');
      inDebateBtn.onclick = () => changeAmendmentStatus(amendment._id, 'in-debate');
    }
    amendmentsList.appendChild(div);
  });
}

async function fetchAmendments() {
  const res = await fetch(`/api/conference/${conferenceCode}/amendments`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  const data = await res.json();
  amendments = data.amendments;
  renderAmendments();
}

amendmentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const resolutionNumber = parseInt(document.getElementById('resolutionNumber').value);
  const clauseNumber = parseInt(document.getElementById('clauseNumber').value);
  const subclause = document.getElementById('subclause').value.trim();
  const subSubClause = document.getElementById('subSubClause').value.trim() || 'N/A';
  const type = document.getElementById('amendmentType').value;
  const content = document.getElementById('amendmentContent').value.trim();
  if (!resolutionNumber || !clauseNumber || !type || !content) return;
  if (subclause && !/^[A-Z]$/.test(subclause)) {
    alert('Subclause must be a single uppercase letter (A-Z)');
    return;
  }
  if (subSubClause && subSubClause !== 'N/A' && !/^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(subSubClause)) {
    alert('Sub-sub clause must be a valid Roman numeral or N/A');
    return;
  }
  const res = await fetch(`/api/conference/${conferenceCode}/amendments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ resolutionNumber, clauseNumber, subclause, subSubClause, type, content })
  });
  if (res.ok) {
    amendmentForm.reset();
    showAmendmentForm(false);
  } else {
    const data = await res.json();
    alert(data.error || 'Failed to submit amendment');
  }
});

cancelAmendment.addEventListener('click', () => {
  showAmendmentForm(false);
});

// Show form button for allowed roles
if (canSubmitAmendment()) {
  showAmendmentForm(true);
}

// --- Socket.IO for Amendments ---
socket.on('newAmendment', (amendment) => {
  amendments.push(amendment);
  renderAmendments();
  if (amendmentsTab.style.display === 'none') {
    amendmentUnreadCount++;
    amendmentNotifCount.textContent = amendmentUnreadCount;
    amendmentNotifCount.style.display = '';
  }
});
socket.on('amendmentStatusChanged', (amendment) => {
  const idx = amendments.findIndex(a => a._id === amendment._id);
  if (idx !== -1) {
    amendments[idx] = amendment;
    renderAmendments();
  }
});

async function changeAmendmentStatus(id, status) {
  const res = await fetch(`/api/conference/${conferenceCode}/amendments/${id}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    const data = await res.json();
    alert(data.error || 'Failed to change status');
  }
}

// --- Init Amendments ---
fetchAmendments();

votingTabBtn.addEventListener('click', () => {
  switchTab(votingTab);
  votingTabBtn.classList.add('active');
  votingUnreadCount = 0;
  votingNotifCount.style.display = 'none';
});

function canOpenCloseVoting() {
  return ['God','Owner','Admin','Chair'].includes(currentUser.role);
}
function canVote() {
  return currentUser.role === 'Delegate';
}
function canSeeResults() {
  return ['God','Owner','Admin','Chair'].includes(currentUser.role);
}

function renderVotingMenu() {
  votingMenu.innerHTML = '';
  if (!votingSession) {
    votingMenu.innerHTML = '<div>No voting session active.</div>';
    votingResults.style.display = 'none';
    return;
  }
  if (votingSession.open) {
    if (canVote()) {
      // Voting menu for delegates
      const currentVote = votingSession.votes && votingSession.votes[currentUser._id];
      const menu = document.createElement('div');
      menu.className = 'voting-menu';
      ['for','against','abstain'].forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'vote-btn' + (currentVote === opt ? ' selected' : '');
        btn.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
        btn.onclick = async () => {
          await castVote(opt);
        };
        menu.appendChild(btn);
      });
      if (voteConfirmation) {
        const conf = document.createElement('div');
        conf.className = 'vote-confirmation';
        conf.textContent = voteConfirmation;
        menu.appendChild(conf);
      }
      votingMenu.appendChild(menu);
      votingResults.style.display = 'none';
    } else if (canOpenCloseVoting()) {
      // Open/close buttons for authorized roles
      const actions = document.createElement('div');
      actions.className = 'voting-actions';
      const closeBtn = document.createElement('button');
      closeBtn.className = 'close';
      closeBtn.textContent = 'Close Voting';
      closeBtn.onclick = closeVoting;
      actions.appendChild(closeBtn);
      votingMenu.appendChild(actions);
      renderVotingResults();
    } else {
      votingMenu.innerHTML = '<div>Voting is open.</div>';
      votingResults.style.display = 'none';
    }
  } else {
    if (canOpenCloseVoting()) {
      // Open button for authorized roles
      const actions = document.createElement('div');
      actions.className = 'voting-actions';
      const openBtn = document.createElement('button');
      openBtn.className = 'open';
      openBtn.textContent = 'Open Voting';
      openBtn.onclick = openVoting;
      actions.appendChild(openBtn);
      votingMenu.appendChild(actions);
      renderVotingResults();
    } else if (canVote()) {
      votingMenu.innerHTML = '<div>Voting is closed.</div>';
      votingResults.style.display = 'none';
    } else {
      votingMenu.innerHTML = '<div>Voting is closed.</div>';
      votingResults.style.display = 'none';
    }
  }
}

function renderVotingResults() {
  if (!canSeeResults() || !votingSession) {
    votingResults.style.display = 'none';
    return;
  }
  votingResults.style.display = '';
  votingResults.className = 'voting-results';
  const res = votingSession.results || { for: 0, against: 0, abstain: 0, notParticipating: 0 };
  votingResults.innerHTML = `
    <div class="result-row"><span class="result-label">For</span><span class="result-value">${res.for}</span></div>
    <div class="result-row"><span class="result-label">Against</span><span class="result-value">${res.against}</span></div>
    <div class="result-row"><span class="result-label">Abstain</span><span class="result-value">${res.abstain}</span></div>
    <div class="result-row"><span class="result-label">Not Participating</span><span class="result-value">${res.notParticipating}</span></div>
  `;
}

async function fetchVotingSession() {
  const res = await fetch(`/api/conference/${conferenceCode}/voting/current`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  const data = await res.json();
  votingSession = data.session;
  renderVotingMenu();
}

async function openVoting() {
  const res = await fetch(`/api/conference/${conferenceCode}/voting/open`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  if (res.ok) {
    voteConfirmation = '';
    await fetchVotingSession();
  }
}

async function closeVoting() {
  const res = await fetch(`/api/conference/${conferenceCode}/voting/close`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  if (res.ok) {
    voteConfirmation = '';
    await fetchVotingSession();
  }
}

async function castVote(vote) {
  const res = await fetch(`/api/conference/${conferenceCode}/voting/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ vote })
  });
  if (res.ok) {
    voteConfirmation = 'Your vote has been recorded.';
    await fetchVotingSession();
  }
}

// --- Socket.IO for Voting ---
socket.on('votingOpened', (session) => {
  votingSession = session;
  voteConfirmation = '';
  renderVotingMenu();
  if (votingTab.style.display === 'none') {
    votingUnreadCount++;
    votingNotifCount.textContent = votingUnreadCount;
    votingNotifCount.style.display = '';
  }
});
socket.on('votingClosed', (session) => {
  votingSession = session;
  voteConfirmation = '';
  renderVotingMenu();
  if (votingTab.style.display === 'none') {
    votingUnreadCount++;
    votingNotifCount.textContent = votingUnreadCount;
    votingNotifCount.style.display = '';
  }
});
socket.on('voteUpdated', () => {
  fetchVotingSession();
});

// --- Init Voting ---
fetchVotingSession();

function canEditContributions() {
  return ['God','Owner','Admin','Chair'].includes(currentUser.role);
}

function renderContributionsTable() {
  if (!canEditContributions()) {
    contributionsTableDiv.innerHTML = '';
    return;
  }
  let html = '<button class="reset-btn" onclick="resetContributions()">Reset All</button>';
  html += '<table class="contributions-table"><thead><tr>';
  html += '<th>Country</th><th>POIs</th><th>Amendments</th><th>Speeches</th><th>Strikes</th></tr></thead><tbody>';
  contributions.forEach(row => {
    html += `<tr><td>${row.country}</td>`;
    ['pois','amendments','speeches','strikes'].forEach(field => {
      const key = `${row.delegateId}_${field}`;
      const minusDisabled = row[field] === 0 || contributionCooldowns[key];
      const plusDisabled = contributionCooldowns[key];
      html += `<td>
        <button class="contribution-btn" ${minusDisabled ? 'disabled' : ''} onclick="updateContribution('${row.delegateId}','${field}',-1)">-</button>
        <span class="contribution-value">${row[field]}</span>
        <button class="contribution-btn" ${plusDisabled ? 'disabled' : ''} onclick="updateContribution('${row.delegateId}','${field}',1)">+</button>
      </td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  contributionsTableDiv.innerHTML = html;
}

window.updateContribution = async (delegateId, field, delta) => {
  const key = `${delegateId}_${field}`;
  if (contributionCooldowns[key]) return;
  contributionCooldowns[key] = true;
  renderContributionsTable();
  await fetch(`/api/conference/${conferenceCode}/contributions/${delegateId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    body: JSON.stringify({ field, delta })
  });
  setTimeout(() => {
    contributionCooldowns[key] = false;
    renderContributionsTable();
  }, 1000);
};

window.resetContributions = async () => {
  if (!confirm('Are you sure you want to reset all contributions to 0?')) return;
  await fetch(`/api/conference/${conferenceCode}/contributions/reset`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
};

function renderAwardsCards() {
  if (!canEditContributions()) {
    awardsCardsDiv.innerHTML = '';
    return;
  }
  const countryOptions = contributions.map(row => `<option value="${row.country}">${row.country}</option>`).join('');
  awardsCardsDiv.innerHTML = `
    <div class="award-card">
      <h3>Best Delegate</h3>
      <select id="bestDelegateSelect">
        <option value="">Select Country</option>
        ${countryOptions}
      </select>
      <button class="award-btn" onclick="setAward('bestDelegate')">Assign</button>
      <div class="award-confirmation">${awardConfirmations.bestDelegate}</div>
    </div>
    <div class="award-card">
      <h3>Honourable Mention</h3>
      <select id="honourableMentionSelect">
        <option value="">Select Country</option>
        ${countryOptions}
      </select>
      <button class="award-btn" onclick="setAward('honourableMention')">Assign</button>
      <div class="award-confirmation">${awardConfirmations.honourableMention}</div>
    </div>
    <div class="award-card">
      <h3>Best Position Paper</h3>
      <select id="bestPositionPaperSelect">
        <option value="">Select Country</option>
        ${countryOptions}
      </select>
      <button class="award-btn" onclick="setAward('bestPositionPaper')">Assign</button>
      <div class="award-confirmation">${awardConfirmations.bestPositionPaper}</div>
    </div>
  `;
}

window.setAward = async (field) => {
  let selectId = '';
  if (field === 'bestDelegate') selectId = 'bestDelegateSelect';
  if (field === 'honourableMention') selectId = 'honourableMentionSelect';
  if (field === 'bestPositionPaper') selectId = 'bestPositionPaperSelect';
  const country = document.getElementById(selectId).value;
  if (!country) return;
  if (!confirm(`Assign ${country} as ${field.replace(/([A-Z])/g, ' $1') .replace(/^./, str => str.toUpperCase())}?`)) return;
  await fetch(`/api/conference/${conferenceCode}/awards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    body: JSON.stringify({ field, country })
  });
  awardConfirmations[field] = 'Award assigned!';
  renderAwardsCards();
  setTimeout(() => { awardConfirmations[field] = ''; renderAwardsCards(); }, 2000);
};

async function fetchContributionsAndAwards() {
  if (!canEditContributions()) {
    contributionsTableDiv.innerHTML = '';
    awardsCardsDiv.innerHTML = '';
    return;
  }
  const res = await fetch(`/api/conference/${conferenceCode}/contributions`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  const data = await res.json();
  contributions = data.contributions;
  const res2 = await fetch(`/api/conference/${conferenceCode}/awards`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  const data2 = await res2.json();
  awards = data2.awards;
  renderContributionsTable();
  renderAwardsCards();
}

// --- Socket.IO for Contributions ---
socket.on('contributionUpdated', ({ delegateId, field, value }) => {
  const row = contributions.find(r => r.delegateId === delegateId);
  if (row) {
    row[field] = value;
    renderContributionsTable();
  }
});
socket.on('contributionsReset', () => {
  fetchContributionsAndAwards();
});
socket.on('awardsUpdated', ({ field, country }) => {
  if (awards) awards[field] = country;
  renderAwardsCards();
});

// --- Init Contributions ---
fetchContributionsAndAwards();

function canGenerateReports() {
  return ['God','Owner','Admin'].includes(currentUser.role);
}

function renderReportSection() {
  if (!canGenerateReports()) {
    reportSection.innerHTML = '';
    return;
  }
  reportSection.innerHTML = reportTypes.map(r => `
    <div class="report-card">
      <h3>${r.label}</h3>
      <button class="generate-btn" onclick="generateReport('${r.type}')">Generate PDF</button>
      <a class="download-link" href="${reportLinks[r.type] || '#'}" target="_blank" style="${reportLinks[r.type] ? '' : 'display:none;'}">Download</a>
    </div>
  `).join('');
}

window.generateReport = async (type) => {
  const res = await fetch(`/api/conference/${conferenceCode}/report/${type}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  if (res.ok) {
    const data = await res.json();
    reportLinks[type] = data.download;
    renderReportSection();
  } else {
    alert('Failed to generate report');
  }
};

reportTabBtn.addEventListener('click', () => {
  switchTab(reportTab);
  reportTabBtn.classList.add('active');
  renderReportSection();
});

// --- LOGOUT BUTTON ---
if (logoutBtn) {
  logoutBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      window.location.href = 'signin_signup.html';
    }
  });
}

// --- TAB SWITCHING ---
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
  btn.addEventListener('click', function() {
    // Remove active from all
    tabButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(tc => tc.style.display = 'none');
    // Add active to clicked
    btn.classList.add('active');
    const tabId = btn.getAttribute('data-tab');
    const tabContent = document.getElementById(tabId);
    if (tabContent) tabContent.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// --- COPY CONFERENCE CODE ---
if (copyCodeBtn && conferenceCode) {
  copyCodeBtn.addEventListener('click', function() {
    navigator.clipboard.writeText(conferenceCode.textContent)
      .then(() => showSuccess('Conference code copied to clipboard!'))
      .catch(() => showError('Failed to copy code.'));
  });
}

// --- ERROR/SUCCESS OVERLAY CLOSE ---
if (errorContainer) {
  errorContainer.addEventListener('click', function(e) {
    if (e.target === errorContainer || e.target.classList.contains('close-error')) {
      errorContainer.style.display = 'none';
    }
  });
}
if (successContainer) {
  successContainer.addEventListener('click', function(e) {
    if (e.target === successContainer || e.target.classList.contains('close-success')) {
      successContainer.style.display = 'none';
    }
  });
}

// --- ACCESSIBILITY: FOCUS STYLES ---
tabButtons.forEach(btn => {
  btn.addEventListener('focus', function() {
    btn.classList.add('active');
  });
  btn.addEventListener('blur', function() {
    btn.classList.remove('active');
  });
}); 