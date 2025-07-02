// Conference page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Conference page loaded successfully');
    
    // Check if user is authenticated immediately
    checkAuthStatus();

    // Add event listeners for conference functions
    setupConferenceEvents();

    // Conference main card buttons
    const participantsBtn = document.querySelector('.participants-btn');
    if (participantsBtn) participantsBtn.addEventListener('click', () => {
        const code = getConferenceCodeFromURL();
        window.location.href = `participants.html?code=${code}`;
    });

    const amendmentsBtn = document.querySelector('.amendments-btn');
    if (amendmentsBtn) amendmentsBtn.addEventListener('click', () => alert('Amendments feature coming soon!'));

    const votingBtn = document.querySelector('.voting-btn');
    if (votingBtn) votingBtn.addEventListener('click', () => alert('Voting feature coming soon!'));

    const notePassingBtn = document.querySelector('.note-passing-btn');
    if (notePassingBtn) notePassingBtn.addEventListener('click', () => alert('Note Passing feature coming soon!'));

    const contributionsBtn = document.querySelector('.contributions-btn');
    if (contributionsBtn) contributionsBtn.addEventListener('click', () => alert('Contributions & Awards feature coming soon!'));

    const reportBtn = document.querySelector('.report-btn');
    if (reportBtn) reportBtn.addEventListener('click', () => alert('Database Report feature coming soon!'));

    // Leave Conference button
    const leaveConferenceBtn = document.querySelector('.leave-conference-btn');
    if (leaveConferenceBtn) leaveConferenceBtn.addEventListener('click', leaveConference);

    // Conference details will be fetched after authentication is confirmed
});

// Fetch and display conference details
async function displayConferenceDetails() {
    const code = getConferenceCodeFromURL();
    if (!code) return;
    try {
    const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/conference/${code}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (response.ok && data.success && data.data) {
            const conf = data.data;
            const nameElem = document.getElementById('conferenceName');
            if (nameElem) nameElem.textContent = conf.name;
            // Display committee name
            const committeeElem = document.getElementById('committeeName');
            if (committeeElem) committeeElem.textContent = conf.committeeName;
            // Display committee issue
            const issueElem = document.getElementById('committeeIssue');
            if (issueElem) issueElem.textContent = conf.committeeIssue;
    } else {
            // No alert - just silently fail
        }
    } catch (err) {
        // No alert - just silently fail
    }
}

function getConferenceCodeFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('code');
}

// Utility function for API calls with automatic token refresh
async function apiCall(url, options = {}) {
    const token = localStorage.getItem('authToken');
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    const finalOptions = { ...defaultOptions, ...options };
    try {
        const response = await fetch(url, finalOptions);
        const newToken = response.headers.get('X-New-Token');
        if (newToken) {
            console.log('Token refreshed via header');
            localStorage.setItem('authToken', newToken);
        }
        const data = await response.json();
        if (data.token) {
            console.log('Token refreshed via response body');
            localStorage.setItem('authToken', data.token);
        }
        return { response, data };
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Check authentication status with automatic token refresh
async function checkAuthStatus() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.log('No token found, redirecting to login');
            window.location.href = 'signin_signup.html';
            return;
        }
        const { response, data } = await apiCall('/api/auth/check');
        if (response.ok && data.success && data.authenticated) {
            if (data.user) {
                const userNameElement = document.getElementById('userName');
                if (userNameElement) {
                    userNameElement.textContent = data.user.username || data.user.fullName || 'User';
                }
            }
            console.log('Authentication successful');
            // Now check if user is a participant in this conference
            const code = getConferenceCodeFromURL();
            if (!code) return;
            const partRes = await apiCall(`/api/participants/${code}`);
            if (partRes.response.ok && partRes.data.success && Array.isArray(partRes.data.data)) {
                const participants = partRes.data.data;
                const userEmail = data.user.email.toLowerCase();
                const isParticipant = participants.some(p => p.email.toLowerCase() === userEmail);
                if (!isParticipant) {
                    showNotParticipantMessage();
                    return;
                }
                // Fetch conference details immediately after authentication and participant verification
                displayConferenceDetails();
            } else {
                showNotParticipantMessage();
                return;
            }
        } else {
            console.log('Authentication failed:', data.message);
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                window.location.href = 'signin_signup.html';
            }
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.log('Network error, keeping current session');
            return;
        }
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = 'signin_signup.html';
    }
}

// Setup conference event listeners
function setupConferenceEvents() {
    // Add click handlers for conference cards
    const cards = document.querySelectorAll('.conference-card');
    cards.forEach(card => {
        card.addEventListener('click', function() {
            const button = this.querySelector('button');
            if (button) {
                button.click();
            }
        });
    });
}

// Show not participant message
function showNotParticipantMessage() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
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
        
        // Add event listener to the return dashboard button
        const returnDashboardBtn = mainContent.querySelector('.return-dashboard-btn');
        if (returnDashboardBtn) {
            returnDashboardBtn.addEventListener('click', function() {
                window.location.href = 'dashboard.html';
            });
        }
    }
}

// Leave Conference function
function leaveConference() {
    if (confirm('Are you sure you want to leave this conference? You will be redirected to the dashboard.')) {
        window.location.href = 'dashboard.html';
    }
}