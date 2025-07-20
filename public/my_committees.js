// Global variables
let currentUser = null;
let userCommittees = [];

// DOM elements (will be initialized after DOM loads)
let loadingSpinner;
let noCommittees;
let committeesTableContainer;
let committeesTableBody;
let logoutBtn;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('My Committees page loaded');
    
    // Initialize DOM elements
    loadingSpinner = document.getElementById('loadingSpinner');
    noCommittees = document.getElementById('noCommittees');
    committeesTableContainer = document.getElementById('committeesTableContainer');
    committeesTableBody = document.getElementById('committeesTableBody');
    logoutBtn = document.querySelector('.logout-btn');
    
    setUserGreeting();
    checkAuthStatus();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const returnDashboardBtn = document.querySelector('.return-dashboard-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    if (returnDashboardBtn) {
        returnDashboardBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            window.location.href = 'dashboard.html';
        });
    }
}

// Check authentication status
async function checkAuthStatus() {
    try {
        const token = localStorage.getItem('authToken');
        console.log('Checking auth with token:', token ? 'Token exists' : 'No token');
        
        if (!token) {
            console.log('No token found, redirecting to login');
            showError('No authentication token found. Please log in.');
            return;
        }

        const response = await fetch('/api/auth/check', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log('Auth check response:', data);
        
        if (data.success && data.authenticated) {
            currentUser = data.user;
            // Update greeting with fresh user data
            updateUserGreeting(currentUser);
            loadUserCommittees();
        } else {
            console.log('Authentication failed');
            showError('Authentication failed. Please log in again.');
            localStorage.removeItem('authToken');
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        // Don't logout on network errors, only on actual auth failures
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.log('Network error, keeping current session');
            showError('Network error. Please check your connection.');
            return;
        }
        showError('Authentication error. Please log in again.');
        localStorage.removeItem('authToken');
    }
}

// Load user committees
async function loadUserCommittees() {
    try {
        showLoading();
        
        const token = localStorage.getItem('authToken');
        console.log('Loading committees with token:', token ? 'Token exists' : 'No token');
        
        const response = await fetch('/api/user-committees', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Committees response status:', response.status);
        const data = await response.json();
        console.log('Committees response data:', data);
        
        if (data.success) {
            userCommittees = data.data;
            console.log('Loaded committees:', userCommittees);
            displayCommittees();
        } else {
            console.error('Error loading committees:', data.message);
            showError('Failed to load committees. Please try again.');
        }
    } catch (error) {
        console.error('Error loading committees:', error);
        showError('Failed to load committees. Please check your connection and try again.');
    }
}

// Display committees in the table
function displayCommittees() {
    if (userCommittees.length === 0) {
        showNoCommittees();
        return;
    }

    hideLoading();
    hideNoCommittees();
    showTable();

    // Clear existing table rows
    if (committeesTableBody) {
        committeesTableBody.innerHTML = '';

        // Add committee rows
        userCommittees.forEach(committee => {
            const row = createCommitteeRow(committee);
            committeesTableBody.appendChild(row);
        });
    } else {
        console.error('committeesTableBody element not found');
        showError('Error displaying committees. Please refresh the page.');
    }
}

// Create a committee table row
function createCommitteeRow(committee) {
    const row = document.createElement('tr');
    
    // Conference name
    const conferenceCell = document.createElement('td');
    conferenceCell.textContent = committee.conferenceName;
    row.appendChild(conferenceCell);

    // Committee name
    const committeeCell = document.createElement('td');
    committeeCell.textContent = committee.committeeName;
    row.appendChild(committeeCell);

    // Role
    const roleCell = document.createElement('td');
    const roleBadge = document.createElement('span');
    roleBadge.className = `role-badge role-${committee.role.toLowerCase()}`;
    roleBadge.textContent = committee.role;
    roleCell.appendChild(roleBadge);
    row.appendChild(roleCell);

    // Country
    const countryCell = document.createElement('td');
    if (committee.country) {
        countryCell.className = 'country-display';
        countryCell.textContent = committee.country;
    } else {
        countryCell.className = 'no-country';
        countryCell.textContent = 'N/A';
    }
    row.appendChild(countryCell);

    // Committee code
    const codeCell = document.createElement('td');
    codeCell.className = 'code-display';
    codeCell.textContent = committee.conferenceCode || 'N/A';
    row.appendChild(codeCell);

    // Action button
    const actionCell = document.createElement('td');
    const enterBtn = document.createElement('button');
    enterBtn.className = 'enter-btn';
    enterBtn.textContent = 'Enter';
    enterBtn.addEventListener('click', () => enterConference(committee.conferenceCode));
    actionCell.appendChild(enterBtn);
    row.appendChild(actionCell);

    return row;
}



// Enter conference
function enterConference(conferenceCode) {
    // Store the conference code in localStorage for the conference page
    localStorage.setItem('currentConferenceCode', conferenceCode);
    // Navigate to the specific conference page
    window.location.href = `conference.html?code=${conferenceCode}`;
}

// Show loading state
function showLoading() {
    if (loadingSpinner) loadingSpinner.style.display = 'flex';
    if (noCommittees) noCommittees.style.display = 'none';
    if (committeesTableContainer) committeesTableContainer.style.display = 'none';
}

// Hide loading state
function hideLoading() {
    if (loadingSpinner) loadingSpinner.style.display = 'none';
}

// Show no committees state
function showNoCommittees() {
    hideLoading();
    if (noCommittees) noCommittees.style.display = 'flex';
    if (committeesTableContainer) committeesTableContainer.style.display = 'none';
}

// Hide no committees state
function hideNoCommittees() {
    if (noCommittees) noCommittees.style.display = 'none';
}

// Show table
function showTable() {
    if (committeesTableContainer) committeesTableContainer.style.display = 'block';
}

// Show error message
function showError(message) {
    hideLoading();
    hideNoCommittees();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="error-content">
            <div class="error-icon">⚠️</div>
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="loadUserCommittees()" class="retry-btn">Try Again</button>
        </div>
    `;
    errorDiv.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 300px;
        text-align: center;
        background: rgba(203, 161, 53, 0.12);
        color: #ffe082;
        border: 1px solid #cba135;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(203, 161, 53, 0.10);
    `;
    const errorContent = errorDiv.querySelector('.error-content');
    errorContent.style.cssText = `
        max-width: 400px;
    `;
    const errorIcon = errorDiv.querySelector('.error-icon');
    errorIcon.style.cssText = `
        font-size: 3rem;
        margin-bottom: 1rem;
    `;
    const retryBtn = errorDiv.querySelector('.retry-btn');
    retryBtn.style.cssText = `
        background: linear-gradient(90deg, #cba135 60%, #ffe082 100%);
        color: #000;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        margin-top: 1rem;
        transition: transform 0.2s ease;
    `;
    retryBtn.addEventListener('mouseenter', () => {
        retryBtn.style.transform = 'translateY(-2px)';
    });
    retryBtn.addEventListener('mouseleave', () => {
        retryBtn.style.transform = 'translateY(0)';
    });
    const container = document.querySelector('.committees-container');
    container.innerHTML = '';
    container.appendChild(errorDiv);
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentConferenceCode');
    window.location.href = 'signin_signup.html';
}

// Refresh data (for potential future use)
function refreshData() {
    loadUserCommittees();
}

function setUserGreeting() {
    const greetingEl = document.getElementById('userGreeting');
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('userData'));
    } catch {}
    if (greetingEl) {
        if (user && (user.username || user.displayName || user.fullName)) {
            const userName = user.username || user.displayName || user.fullName;
            greetingEl.innerHTML = `Welcome, <span id="userName">${userName}</span>`;
        } else {
            // Don't redirect immediately, let the auth check handle it
            greetingEl.innerHTML = 'Welcome, <span id="userName">User</span>';
        }
    }
}

function updateUserGreeting(user) {
    const greetingEl = document.getElementById('userGreeting');
    if (greetingEl && user) {
        const userName = user.username || user.displayName || user.fullName || 'User';
        greetingEl.innerHTML = `Welcome, <span id="userName">${userName}</span>`;
    }
} 