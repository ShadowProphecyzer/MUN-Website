// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupEventListeners();
});

// Utility function for API calls with automatic token refresh
async function apiCall(url, options = {}) {
    console.log('🌐 API Call:', url, 'Options:', options);
    const token = localStorage.getItem('authToken');
    console.log('🔑 Token for API call:', !!token, 'Length:', token ? token.length : 0);
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    const finalOptions = { ...defaultOptions, ...options };
    console.log('📤 Final request options:', finalOptions);
    
    try {
        console.log('📡 Making fetch request...');
        const response = await fetch(url, finalOptions);
        console.log('📥 Response received:', {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText
        });
        
        const newToken = response.headers.get('X-New-Token');
        if (newToken) {
            console.log('🔄 New token received in header');
            localStorage.setItem('authToken', newToken);
        }
        
        const data = await response.json();
        console.log('📄 Response data:', data);
        
        if (data.token) {
            console.log('🔄 New token received in body');
            localStorage.setItem('authToken', data.token);
        }
        
        return { response, data };
    } catch (error) {
        console.error('💥 API call failed:', error);
        throw error;
    }
}

// Check authentication status with automatic token refresh
async function checkAuthStatus() {
    console.log('🔐 Starting checkAuthStatus...');
    try {
        const token = localStorage.getItem('authToken');
        console.log('📋 Token found:', !!token, 'Token length:', token ? token.length : 0);
        
        if (!token) {
            console.log('❌ No token found, redirecting to signin');
            window.location.href = 'signin_signup.html';
            return;
        }
        
        console.log('🔍 Calling /api/auth/check...');
        const { response, data } = await apiCall('/api/auth/check');
        console.log('📡 Auth check response:', {
            status: response.status,
            ok: response.ok,
            success: data.success,
            authenticated: data.authenticated,
            hasUser: !!data.user
        });
        
        if (response.ok && data.success && data.authenticated) {
            console.log('✅ Authentication successful');
            if (data.user) {
                console.log('👤 User data:', {
                    username: data.user.username,
                    email: data.user.email,
                    role: data.user.role
                });
                
                const userNameElement = document.getElementById('userName');
                if (userNameElement) {
                    userNameElement.textContent = data.user.username || data.user.fullName || 'User';
                    console.log('✅ Updated userName element');
                } else {
                    console.log('⚠️ userName element not found');
                }
                
                // Load conference info
                console.log('🏢 Loading conference info...');
                loadConferenceInfo();
                
                // Fetch participant info separately (like amendments page)
                console.log('👥 Starting participant info fetch...');
                fetchParticipantInfo();
                
                // Initialize socket and fetch contributions after participant verification
                initializeSocket();
                fetchAndDisplayContributions();
            } else {
                console.log('⚠️ No user data in response');
            }
        } else {
            console.log('❌ Authentication failed:', {
                responseOk: response.ok,
                dataSuccess: data.success,
                authenticated: data.authenticated
            });
            
            if (response.status === 401 || response.status === 403) {
                console.log('🚫 Unauthorized/Forbidden, clearing tokens and redirecting');
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                window.location.href = 'signin_signup.html';
            }
        }
    } catch (error) {
        console.error('💥 Auth check error:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = 'signin_signup.html';
    }
}

// Fetch participant info for this conference (separate function like amendments page)
async function fetchParticipantInfo() {
    console.log('👥 Starting fetchParticipantInfo...');
    const code = getConferenceCodeFromURL();
    console.log('🏢 Conference code from URL:', code);
    
    if (!code) {
        console.log('❌ No conference code found in URL');
        return;
    }
    
    try {
        console.log('🔍 Calling /api/auth/check for participant info...');
        const authRes = await apiCall('/api/auth/check');
        console.log('📡 Auth response for participant check:', {
            hasData: !!authRes.data,
            hasUser: !!authRes.data?.user,
            userEmail: authRes.data?.user?.email
        });
        
        if (!authRes.data || !authRes.data.user) {
            console.log('❌ No user data in auth response');
            return;
        }
        
        console.log('👥 Calling /api/participants/' + code + '...');
        const partRes = await apiCall(`/api/participants/${code}`);
        console.log('📡 Participants response:', {
            status: partRes.response.status,
            ok: partRes.response.ok,
            success: partRes.data.success,
            hasData: !!partRes.data.data,
            isArray: Array.isArray(partRes.data.data),
            dataLength: partRes.data.data ? partRes.data.data.length : 0
        });
        
        if (partRes.response.ok && partRes.data.success && Array.isArray(partRes.data.data)) {
            const userEmail = authRes.data.user.email.toLowerCase();
            console.log('📧 User email to find:', userEmail);
            console.log('👥 All participants:', partRes.data.data);
            
            const currentParticipant = partRes.data.data.find(p => {
                const participantEmail = p.email ? p.email.toLowerCase() : '';
                console.log('🔍 Checking participant:', p.email, 'vs user:', userEmail, 'Match:', participantEmail === userEmail);
                return participantEmail === userEmail;
            });
            
            if (!currentParticipant) {
                console.log('❌ User not found in participants list');
                console.log('📧 User email:', userEmail);
                console.log('👥 Available participants:', partRes.data.data.map(p => p.email));
                showNotParticipantMessage();
                return;
            }
            
            console.log('✅ Participant verified:', currentParticipant);
            
            // Check if participant has required role for contributions access
            const allowedRoles = ['god', 'owner', 'administrator', 'chair'];
            const participantRole = currentParticipant.role ? currentParticipant.role.trim().toLowerCase() : '';
            const hasRequiredRole = allowedRoles.includes(participantRole);
            
            console.log('🔐 Role check:', {
                participantRole,
                allowedRoles,
                hasRequiredRole
            });
            
            if (!hasRequiredRole) {
                console.warn('❌ Participant does not have required role for contributions access:', {
                    participantRole,
                    allowedRoles
                });
                showAccessDeniedMessage();
                return;
            }
            
            console.log('🎉 Page is ready - participant found with required role!');
            // Page is ready - participant found with required role
        } else {
            console.log('❌ Participants API call failed or invalid response');
            showNotParticipantMessage();
            return;
        }
    } catch (error) {
        console.error('💥 Error fetching participant info:', error);
        showNotParticipantMessage();
    }
}



// Load conference information
function loadConferenceInfo() {
    console.log('🏢 Starting loadConferenceInfo...');
    // First try to get from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    let conferenceCode = urlParams.get('code');
    console.log('🔗 Conference code from URL:', conferenceCode);
    
    // If not in URL, try localStorage
    if (!conferenceCode) {
        conferenceCode = localStorage.getItem('conferenceCode');
        console.log('💾 Conference code from localStorage:', conferenceCode);
    }
    
    if (!conferenceCode) {
        console.error('❌ No conference code found');
        return;
    }

    // Store in localStorage for consistency
    localStorage.setItem('conferenceCode', conferenceCode);
    console.log('💾 Stored conference code in localStorage:', conferenceCode);
    
    const conferenceNameElement = document.getElementById('conference-name');
    if (conferenceNameElement) {
        conferenceNameElement.textContent = conferenceCode;
        console.log('✅ Updated conference name element');
    } else {
        console.log('⚠️ conference-name element not found');
    }
}

// Global variables
let socket = null;
let contributionsData = [];
let buttonCooldowns = new Map(); // Track button cooldowns
const COOLDOWN_TIME = 750; // 0.75 seconds

// Setup event listeners
function setupEventListeners() {
    // Return to conference button
    const returnConferenceBtn = document.querySelector('.return-conference-btn');
    if (returnConferenceBtn) {
        returnConferenceBtn.addEventListener('click', function() {
            const code = getConferenceCodeFromURL();
            if (code) {
                window.location.href = `conference.html?code=${code}`;
            } else {
                window.location.href = 'conference.html';
            }
        });
    }

    // Leave conference button
    const leaveConferenceBtn = document.querySelector('.leave-conference-btn');
    if (leaveConferenceBtn) {
        leaveConferenceBtn.addEventListener('click', function() {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            window.location.href = 'dashboard.html';
        });
    }
}

// Initialize Socket.IO
function initializeSocket() {
    const code = getConferenceCodeFromURL();
    if (code) {
        socket = io();
        socket.emit('joinConference', code);
        
        socket.on('contributionUpdate', (data) => {
            console.log('📡 Received contribution update:', data);
            updateContributionInTable(data);
        });
    }
}

// Fetch and display contributions
async function fetchAndDisplayContributions() {
    const code = getConferenceCodeFromURL();
    if (!code) return;

    try {
        console.log('📊 Fetching contributions...');
        const response = await apiCall(`/api/contributions/${code}`);
        console.log('📡 Contributions API response:', response);
        
        if (response.response.ok && response.data.success) {
            contributionsData = response.data.data;
            console.log('✅ Contributions loaded:', contributionsData);
            renderContributionsTable();
        } else {
            console.error('❌ Failed to fetch contributions:', response.data.message);
            showErrorMessage('Failed to load contributions data');
        }
    } catch (error) {
        console.error('💥 Error fetching contributions:', error);
        showErrorMessage('Error loading contributions');
    }
}

// Render the contributions table
function renderContributionsTable() {
    const tbody = document.getElementById('contributions-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (contributionsData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-message">
                    No contribution data found. Initialize the table to get started.
                </td>
            </tr>
        `;
        return;
    }

    contributionsData.forEach(contribution => {
        const row = createContributionRow(contribution);
        tbody.appendChild(row);
    });
}

// Create a table row for a contribution
function createContributionRow(contribution) {
    const row = document.createElement('tr');
    row.setAttribute('data-country', contribution.country);
    
    row.innerHTML = `
        <td>${contribution.country}</td>
        <td>
            <label class="toggle-switch">
                <input type="checkbox" ${contribution.present ? 'checked' : ''} 
                       onchange="updateToggle('${contribution.country}', 'present', this.checked)">
                <span class="toggle-slider"></span>
            </label>
        </td>
        <td>
            <label class="toggle-switch">
                <input type="checkbox" ${contribution.voting ? 'checked' : ''} 
                       onchange="updateToggle('${contribution.country}', 'voting', this.checked)">
                <span class="toggle-slider"></span>
            </label>
        </td>
        <td>
            <div class="number-counter">
                <button class="counter-btn" onclick="updateCounter('${contribution.country}', 'pois', -1)">-</button>
                <span class="counter-value">${contribution.pois}</span>
                <button class="counter-btn" onclick="updateCounter('${contribution.country}', 'pois', 1)">+</button>
            </div>
        </td>
        <td>
            <div class="number-counter">
                <button class="counter-btn" onclick="updateCounter('${contribution.country}', 'amendments', -1)">-</button>
                <span class="counter-value">${contribution.amendments}</span>
                <button class="counter-btn" onclick="updateCounter('${contribution.country}', 'amendments', 1)">+</button>
            </div>
        </td>
        <td>
            <div class="number-counter">
                <button class="counter-btn" onclick="updateCounter('${contribution.country}', 'speeches', -1)">-</button>
                <span class="counter-value">${contribution.speeches}</span>
                <button class="counter-btn" onclick="updateCounter('${contribution.country}', 'speeches', 1)">+</button>
            </div>
        </td>
    `;
    
    return row;
}

// Update toggle switches
async function updateToggle(country, field, value) {
    if (isButtonOnCooldown(country, field)) {
        console.log('⏳ Button on cooldown');
        return;
    }

    setButtonCooldown(country, field);

    try {
        const code = getConferenceCodeFromURL();
        const response = await apiCall(`/api/contributions/${code}/${encodeURIComponent(country)}/${field}`, {
            method: 'PATCH',
            body: JSON.stringify({ value })
        });

        if (response.response.ok && response.data.success) {
            console.log(`✅ Updated ${field} for ${country}:`, value);
            updateContributionInTable({ country, field, value });
        } else {
            console.error('❌ Failed to update toggle:', response.data.message);
        }
    } catch (error) {
        console.error('💥 Error updating toggle:', error);
    }
}

// Update number counters
async function updateCounter(country, field, change) {
    if (isButtonOnCooldown(country, field)) {
        console.log('⏳ Button on cooldown');
        return;
    }

    setButtonCooldown(country, field);

    // Find current value
    const contribution = contributionsData.find(c => c.country === country);
    if (!contribution) return;

    const currentValue = contribution[field] || 0;
    const newValue = Math.max(0, currentValue + change); // Ensure non-negative

    try {
        const code = getConferenceCodeFromURL();
        const response = await apiCall(`/api/contributions/${code}/${encodeURIComponent(country)}/${field}`, {
            method: 'PATCH',
            body: JSON.stringify({ value: newValue })
        });

        if (response.response.ok && response.data.success) {
            console.log(`✅ Updated ${field} for ${country}: ${currentValue} → ${newValue}`);
            updateContributionInTable({ country, field, value: newValue });
        } else {
            console.error('❌ Failed to update counter:', response.data.message);
        }
    } catch (error) {
        console.error('💥 Error updating counter:', error);
    }
}

// Update contribution in the table (for live updates)
function updateContributionInTable(updateData) {
    const { country, field, value } = updateData;
    
    // Update local data
    const contribution = contributionsData.find(c => c.country === country);
    if (contribution) {
        contribution[field] = value;
    }

    // Update UI
    const row = document.querySelector(`tr[data-country="${country}"]`);
    if (row) {
        if (field === 'present' || field === 'voting') {
            const checkbox = row.querySelector(`input[onchange*="${field}"]`);
            if (checkbox) {
                checkbox.checked = value;
            }
        } else {
            const counterValue = row.querySelector(`.number-counter .counter-value`);
            if (counterValue) {
                counterValue.textContent = value;
            }
        }
    }
}

// Button cooldown management
function isButtonOnCooldown(country, field) {
    const key = `${country}-${field}`;
    const lastClick = buttonCooldowns.get(key);
    return lastClick && (Date.now() - lastClick) < COOLDOWN_TIME;
}

function setButtonCooldown(country, field) {
    const key = `${country}-${field}`;
    buttonCooldowns.set(key, Date.now());
}

// Show error message
function showErrorMessage(message) {
    const tbody = document.getElementById('contributions-table-body');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="error-message">
                    ${message}
                </td>
            </tr>
        `;
    }
}

// Initialize contributions (create records for all delegates)
async function initializeContributions() {
    const code = getConferenceCodeFromURL();
    if (!code) return;

    try {
        console.log('🚀 Initializing contributions...');
        const response = await apiCall(`/api/contributions/${code}/initialize`, {
            method: 'POST'
        });

        if (response.response.ok && response.data.success) {
            console.log('✅ Contributions initialized:', response.data.message);
            fetchAndDisplayContributions();
        } else {
            console.error('❌ Failed to initialize contributions:', response.data.message);
        }
    } catch (error) {
        console.error('💥 Error initializing contributions:', error);
    }
}

// Placeholder functions for future functionality
function loadContributions() {
    console.log('Loading contributions...');
    // This will be implemented later
}

function submitContribution() {
    console.log('Submitting contribution...');
    // This will be implemented later
}

function searchContributions() {
    console.log('Searching contributions...');
    // This will be implemented later
}

function filterContributions() {
    console.log('Filtering contributions...');
    // This will be implemented later
}

// Utility functions
function showMessage(message, type = 'info') {
    // Create a simple message display
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;

    switch (type) {
        case 'success':
            messageDiv.style.background = '#28a745';
            break;
        case 'error':
            messageDiv.style.background = '#dc3545';
            break;
        case 'warning':
            messageDiv.style.background = '#ffc107';
            messageDiv.style.color = '#000';
            break;
        default:
            messageDiv.style.background = '#17a2b8';
    }

    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    // Remove after 3 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations for messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Helper functions
function getConferenceCodeFromURL() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    console.log('🔗 getConferenceCodeFromURL() returned:', code);
    return code;
}

function showNotParticipantMessage() {
    console.log('🚫 Showing not participant message...');
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        console.log('✅ Found main-content, showing error message');
        mainContent.innerHTML = `
            <section class="welcome-section">
                <div class="error-message">
                    <div class="error-content">
                        <h3>❌ Access Denied</h3>
                        <p>You are not a participant of this conference.</p>
                        <p>Please contact the conference administrator to be added as a participant.</p>
                        <button class="return-dashboard-btn">Return to Dashboard</button>
                    </div>
                </div>
            </section>
        `;
        const returnDashboardBtn = mainContent.querySelector('.return-dashboard-btn');
        if (returnDashboardBtn) {
            returnDashboardBtn.addEventListener('click', function() {
                console.log('🔄 Returning to dashboard...');
                window.location.href = 'dashboard.html';
            });
        }
    } else {
        console.log('❌ main-content element not found');
    }
}

function showAccessDeniedMessage() {
    console.log('🚫 Showing access denied message...');
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        console.log('✅ Found main-content, showing access denied message');
        mainContent.innerHTML = `
            <section class="welcome-section">
                <div class="error-message">
                    <div class="error-content">
                        <h3>❌ Access Denied</h3>
                        <p>You do not have permission to access the Contributions page.</p>
                        <p>Only God, Owner, Administrator, and Chair roles can access this feature.</p>
                        <button class="return-conference-btn">Return to Conference</button>
                    </div>
                </div>
            </section>
        `;
        const returnConferenceBtn = mainContent.querySelector('.return-conference-btn');
        if (returnConferenceBtn) {
            returnConferenceBtn.addEventListener('click', function() {
                console.log('🔄 Returning to conference...');
                const code = getConferenceCodeFromURL();
                if (code) {
                    window.location.href = `conference.html?code=${code}`;
                } else {
                    window.location.href = 'conference.html';
                }
            });
        }
    } else {
        console.log('❌ main-content element not found');
    }
}

// Export functions for potential use in other scripts
window.contributionsApp = {
    loadContributions,
    submitContribution,
    searchContributions,
    filterContributions,
    showMessage
};