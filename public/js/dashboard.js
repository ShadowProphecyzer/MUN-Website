// dashboard.js

let currentUserId = null;
let currentUserEmail = null;
let isGodUser = false;

document.addEventListener('DOMContentLoaded', () => {
  const dashboard = document.getElementById('dashboard');

  // Check if user is logged in
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/public_access/login/login.html';
    return;
  }

  // Load user data and conferences
  loadUserData();
  loadUserConferences();

  // Dummy data (to be replaced with real data later)
  const documents = [
    "Opening Ceremony Agenda",
    "Code of Conduct",
    "Rules of Procedure",
    "Delegate Handbook"
  ];

  // Welcome box
  const welcomeBox = document.createElement('div');
  welcomeBox.className = 'dashboard-welcome';
  welcomeBox.innerHTML = `
    <h1>Welcome to MUN Conference Manager</h1>
    <p>Manage your conferences and participate in MUN sessions.</p>
    <div class="user-info">
      <span id="user-role">Loading...</span> | 
      <span id="user-country">Loading...</span>
    </div>
    <div id="god-indicator" class="god-indicator" style="display: none;">
      <span class="god-badge">👑 GOD MODE</span>
    </div>
  `;
  dashboard.appendChild(welcomeBox);

  // World-Wide Message Button for God
  const worldWideMessageSection = document.createElement('div');
  worldWideMessageSection.className = 'world-wide-message-section';
  worldWideMessageSection.id = 'worldWideMessageSection';
  worldWideMessageSection.style.display = 'none';
  worldWideMessageSection.innerHTML = `
    <h3>🌍 Divine Communication</h3>
    <button onclick="openWorldWideMessageModal()" class="btn-god">
      ✨ Send Words of Enlightenment
    </button>
  `;
  dashboard.appendChild(worldWideMessageSection);

  // Conference Selector for God users
  const conferenceSelector = document.createElement('div');
  conferenceSelector.className = 'conference-selector';
  conferenceSelector.id = 'conferenceSelector';
  conferenceSelector.style.display = 'none';
  conferenceSelector.innerHTML = `
    <h3>Select Conference (God Mode)</h3>
    <div class="selector-controls">
      <input type="text" id="conferenceSearch" placeholder="Search conferences..." class="search-input">
      <select id="conferenceDropdown" class="conference-dropdown">
        <option value="">Loading conferences...</option>
      </select>
    </div>
  `;
  dashboard.appendChild(conferenceSelector);

  // My Conferences section
  const conferencesSection = document.createElement('div');
  conferencesSection.className = 'my-conferences';
  conferencesSection.innerHTML = `
    <h2>My Conferences</h2>
    <div id="conferencesList" class="conferences-grid">
      <p>Loading conferences...</p>
    </div>
    <div class="conference-actions">
      <button onclick="window.location.href='conference.html'" class="btn-primary">Create New Conference</button>
      <button onclick="showJoinConferenceModal()" class="btn-secondary">Join Conference</button>
    </div>
  `;
  dashboard.appendChild(conferencesSection);

  // Documents section
  const docsSection = document.createElement('div');
  docsSection.className = 'attached-docs';
  docsSection.innerHTML = `<h2>Conference Documents</h2>`;

  const docList = document.createElement('ul');
  documents.forEach(doc => {
    const li = document.createElement('li');
    li.textContent = doc;
    docList.appendChild(li);
  });

  docsSection.appendChild(docList);
  dashboard.appendChild(docsSection);

  // Quick stats section
  const statsSection = document.createElement('div');
  statsSection.className = 'quick-stats';
  statsSection.innerHTML = `
    <h2>Overall Statistics</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Conferences</h3>
        <p id="total-conferences">Loading...</p>
      </div>
      <div class="stat-card">
        <h3>Conferences Owned</h3>
        <p id="owned-conferences">Loading...</p>
      </div>
      <div class="stat-card">
        <h3>Active Sessions</h3>
        <p id="active-sessions">Loading...</p>
      </div>
      <div class="stat-card">
        <h3>Total Participants</h3>
        <p id="total-participants">Loading...</p>
      </div>
    </div>
  `;
  dashboard.appendChild(statsSection);

  // Setup event listeners
  setupEventListeners();
});

// Load user data from API
async function loadUserData() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const userData = await response.json();
      currentUserId = userData._id;
      currentUserEmail = userData.email;
      
      document.getElementById('user-role').textContent = userData.username;
      document.getElementById('user-country').textContent = userData.email;

      // Check if user is God
      const godEmail = await getGodEmail();
      isGodUser = godEmail && userData.email === godEmail;
      
      if (isGodUser) {
        document.getElementById('god-indicator').style.display = 'block';
        document.getElementById('conferenceSelector').style.display = 'block';
        document.getElementById('worldWideMessageSection').style.display = 'block';
        loadAllConferencesForGod();
      }
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}

// Get God email from environment (this would be done server-side, but for demo we'll check)
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

// Open world-wide message modal
function openWorldWideMessageModal() {
  const modal = document.createElement('div');
  modal.className = 'world-wide-modal';
  modal.innerHTML = `
    <div class="world-wide-modal-content">
      <div class="modal-header">
        <h2>🌍 Words of Enlightenment</h2>
        <span class="close-modal" onclick="closeWorldWideModal()">&times;</span>
      </div>
      <form id="worldWideMessageForm">
        <div class="form-group">
          <label for="worldWideMessage">Your Divine Message:</label>
          <textarea 
            id="worldWideMessage" 
            name="message" 
            rows="4" 
            maxlength="500" 
            placeholder="Share your wisdom with all users..."
            required
          ></textarea>
          <div class="char-count">
            <span id="charCount">0</span>/500 characters
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" onclick="closeWorldWideModal()" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-god">✨ Send Enlightenment</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Setup character counter
  const textarea = document.getElementById('worldWideMessage');
  const charCount = document.getElementById('charCount');
  
  textarea.addEventListener('input', () => {
    charCount.textContent = textarea.value.length;
  });
  
  // Setup form submission
  document.getElementById('worldWideMessageForm').addEventListener('submit', handleWorldWideMessage);
  
  // Animate modal in
  setTimeout(() => modal.classList.add('show'), 10);
}

// Close world-wide message modal
function closeWorldWideModal() {
  const modal = document.querySelector('.world-wide-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  }
}

// Handle world-wide message submission
async function handleWorldWideMessage(e) {
  e.preventDefault();
  
  const message = document.getElementById('worldWideMessage').value.trim();
  
  if (!message) {
    alert('Please enter a message');
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/conference/world-wide-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message })
    });
    
    if (response.ok) {
      alert('✨ Words of Enlightenment sent to all users!');
      closeWorldWideModal();
    } else {
      const error = await response.json();
      alert(`Error: ${error.message}`);
    }
  } catch (error) {
    console.error('Error sending world-wide message:', error);
    alert('Failed to send world-wide message');
  }
}

// Load all conferences for God users
async function loadAllConferencesForGod() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/conference/all', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const conferences = await response.json();
      populateConferenceDropdown(conferences);
    }
  } catch (error) {
    console.error('Error loading all conferences:', error);
  }
}

// Populate conference dropdown for God users
function populateConferenceDropdown(conferences) {
  const dropdown = document.getElementById('conferenceDropdown');
  const searchInput = document.getElementById('conferenceSearch');
  
  // Store conferences for filtering
  window.allConferences = conferences;
  
  const options = conferences.map(conference => 
    `<option value="${conference._id}">${conference.name} (${conference.code}) - ${conference.participants.length} participants</option>`
  ).join('');
  
  dropdown.innerHTML = `<option value="">Select a conference...</option>${options}`;
  
  // Setup search functionality
  searchInput.addEventListener('input', filterConferences);
  dropdown.addEventListener('change', onConferenceSelect);
}

// Filter conferences based on search input
function filterConferences() {
  const searchTerm = document.getElementById('conferenceSearch').value.toLowerCase();
  const dropdown = document.getElementById('conferenceDropdown');
  const conferences = window.allConferences || [];
  
  const filteredConferences = conferences.filter(conference => 
    conference.name.toLowerCase().includes(searchTerm) || 
    conference.code.toLowerCase().includes(searchTerm)
  );
  
  const options = filteredConferences.map(conference => 
    `<option value="${conference._id}">${conference.name} (${conference.code}) - ${conference.participants.length} participants</option>`
  ).join('');
  
  dropdown.innerHTML = `<option value="">Select a conference...</option>${options}`;
}

// Handle conference selection for God users
function onConferenceSelect() {
  const selectedId = document.getElementById('conferenceDropdown').value;
  if (selectedId) {
    // Store selected conference and redirect to settings or conference view
    localStorage.setItem('selectedConferenceId', selectedId);
    // You could redirect to a specific conference view or show conference details
    alert(`Selected conference: ${selectedId}`);
  }
}

// Load user's conferences
async function loadUserConferences() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/conference/my', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const conferences = await response.json();
      displayConferences(conferences);
      updateDashboardStats(conferences);
    }
  } catch (error) {
    console.error('Error loading conferences:', error);
    document.getElementById('conferencesList').innerHTML = '<p>Error loading conferences</p>';
  }
}

// Display conferences in the dashboard
function displayConferences(conferences) {
  const container = document.getElementById('conferencesList');
  
  if (conferences.length === 0) {
    container.innerHTML = `
      <div class="no-conferences">
        <p>You haven't joined any conferences yet.</p>
        <p>Create a new conference or join an existing one to get started!</p>
      </div>
    `;
    return;
  }

  const conferencesHtml = conferences.map(conference => {
    const participant = conference.participants.find(p => p.user === currentUserId);
    const role = participant ? participant.role : 'Unknown';
    const isOwner = role === 'owner';
    const isGod = role === 'god';
    
    return `
      <div class="conference-card">
        <div class="conference-header">
          <h3>${conference.name}</h3>
          <span class="role-badge role-${role}">${role}</span>
        </div>
        <div class="conference-info">
          <p><strong>Code:</strong> ${conference.code}</p>
          <p><strong>Created:</strong> ${new Date(conference.createdAt).toLocaleDateString()}</p>
          <p><strong>Participants:</strong> ${conference.participants.length}</p>
        </div>
        <div class="conference-actions">
          <button onclick="enterConference('${conference._id}')" class="btn-primary">Enter Conference</button>
          ${(isOwner || isGod) ? `<button onclick="openSettings('${conference._id}')" class="btn-secondary">Settings</button>` : ''}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = conferencesHtml;
}

// Update dashboard statistics
function updateDashboardStats(conferences) {
  const totalConferences = conferences.length;
  const ownedConferences = conferences.filter(c => 
    c.participants.some(p => p.user === currentUserId && (p.role === 'owner' || p.role === 'god'))
  ).length;
  const totalParticipants = conferences.reduce((sum, c) => sum + c.participants.length, 0);

  document.getElementById('total-conferences').textContent = totalConferences;
  document.getElementById('owned-conferences').textContent = ownedConferences;
  document.getElementById('active-sessions').textContent = totalConferences; // For now, all conferences are "active"
  document.getElementById('total-participants').textContent = totalParticipants;
}

// Setup event listeners
function setupEventListeners() {
  // Add any additional event listeners here
}

// Enter a conference
function enterConference(conferenceId) {
  // Store the conference ID and redirect to the main conference interface
  localStorage.setItem('currentConferenceId', conferenceId);
  // You can redirect to a specific conference page or stay on dashboard with conference context
  alert('Entering conference... (Conference interface would load here)');
}

// Open conference settings
function openSettings(conferenceId) {
  window.location.href = `settings.html?id=${conferenceId}`;
}

// Show join conference modal
function showJoinConferenceModal() {
  const code = prompt('Enter conference code:');
  if (code) {
    joinConference(code);
  }
}

// Join conference by code
async function joinConference(code) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/conference/join', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: code,
        role: 'delegate'
      })
    });

    if (response.ok) {
      alert('Successfully joined conference!');
      loadUserConferences(); // Refresh the list
    } else {
      const error = await response.json();
      alert(`Error: ${error.message}`);
    }
  } catch (error) {
    console.error('Error joining conference:', error);
    alert('Failed to join conference');
  }
}
