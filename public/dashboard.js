console.log('dashboard.js loaded');

// Dashboard page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard page loaded successfully');
    
    // Check if user is authenticated
    checkAuthStatus();
    
    // Add event listeners for dashboard functions
    setupDashboardEvents();

    // Dashboard main card buttons
    const createBtn = document.querySelector('.create-committees-btn');
    if (createBtn) createBtn.addEventListener('click', createCommittees);

    const joinBtn = document.querySelector('.join-committees-btn');
    if (joinBtn) joinBtn.addEventListener('click', joinCommittees);

    const viewCommitteesBtn = document.querySelector('.view-committees-btn');
    if (viewCommitteesBtn) viewCommitteesBtn.addEventListener('click', viewCommittees);

    const viewConferencesBtn = document.querySelector('.view-conferences-btn');
    if (viewConferencesBtn) viewConferencesBtn.addEventListener('click', viewConferences);

    const viewResourcesBtn = document.querySelector('.view-resources-btn');
    if (viewResourcesBtn) viewResourcesBtn.addEventListener('click', viewResources);

    const viewProfileBtn = document.querySelector('.view-profile-btn');
    if (viewProfileBtn) viewProfileBtn.addEventListener('click', viewProfile);

    // Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // Modal buttons
    document.querySelectorAll('.cancel-conference-btn').forEach(btn => {
        btn.addEventListener('click', cancelConferenceCreation);
    });
    document.querySelectorAll('.proceed-step2-btn').forEach(btn => {
        btn.addEventListener('click', proceedToStep2);
    });
    // Form submit handled below
});

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
        
        // Check for new token in response headers
        const newToken = response.headers.get('X-New-Token');
        if (newToken) {
            console.log('Token refreshed via header');
            localStorage.setItem('authToken', newToken);
        }
        
        const data = await response.json();
        
        // Check for new token in response body
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
            // Update user display
            if (data.user) {
                const userNameElement = document.getElementById('userName');
                if (userNameElement) {
                    userNameElement.textContent = data.user.username || data.user.fullName || 'User';
                }
            }
            
            console.log('Authentication successful');
        } else {
            console.log('Authentication failed:', data.message);
            // Only logout if it's a real authentication error, not a network issue
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                window.location.href = 'signin_signup.html';
            }
        }
        
    } catch (error) {
        console.error('Auth check failed:', error);
        // Don't logout on network errors, only on actual auth failures
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.log('Network error, keeping current session');
            return;
        }
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = 'signin_signup.html';
    }
}

// Setup dashboard event listeners
function setupDashboardEvents() {
    // Add click handlers for dashboard cards
    const cards = document.querySelectorAll('.dashboard-card');
    cards.forEach(card => {
        card.addEventListener('click', function() {
            const button = this.querySelector('button');
            if (button) {
                button.click();
            }
        });
    });
}

// Dashboard functions
function viewProfile() {
    window.location.href = 'profile.html';
}

// --- Dashboard Card Actions ---
// 'Create Committees' uses the modal below (JS needed)
// All other cards use direct links and do not need JS functions.

// Modal logic for 'Create Committees'
function createCommittees() {
    showConferenceModal();
}

// --- End of Dashboard Card Actions ---

// Conference Creation Functions
function showConferenceModal() {
    const modal = document.getElementById('conferenceModal');
    modal.style.display = 'flex';
    showStep(1);
}

function hideConferenceModal() {
    const modal = document.getElementById('conferenceModal');
    modal.style.display = 'none';
    resetForm();
}

function showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.modal-step').forEach(step => {
        step.style.display = 'none';
    });
    
    // Show the specified step
    document.getElementById(`step${stepNumber}`).style.display = 'block';
}

function proceedToStep2() {
    showStep(2);
}

function cancelConferenceCreation() {
    hideConferenceModal();
}

function resetForm() {
    document.getElementById('conferenceForm').reset();
    clearErrors();
    showStep(1);
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(error => {
        error.textContent = '';
    });
}

// Form submission
document.addEventListener('DOMContentLoaded', function() {
    const conferenceForm = document.getElementById('conferenceForm');
    if (conferenceForm) {
        conferenceForm.addEventListener('submit', handleConferenceSubmit);
    }
});

async function handleConferenceSubmit(e) {
    e.preventDefault();
    
    clearErrors();
    
    const formData = {
        conferenceName: document.getElementById('conferenceName').value.trim(),
        committeeName: document.getElementById('committeeName').value.trim(),
        committeeIssue: document.getElementById('committeeIssue').value.trim()
    };
    
    // Basic validation
    let hasErrors = false;
    
    if (!formData.conferenceName) {
        showError('conferenceNameError', 'Conference name is required');
        hasErrors = true;
    }
    
    if (!formData.committeeName) {
        showError('committeeNameError', 'Committee name is required');
        hasErrors = true;
    }
    
    if (!formData.committeeIssue) {
        showError('committeeIssueError', 'Committee issue is required');
        hasErrors = true;
    }
    
    if (hasErrors) {
        return;
    }
    
    // Show loading step
    showStep(3);
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/conference/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Conference created successfully
            hideConferenceModal();
            
            // Redirect to conference page
            window.location.href = `conference.html?code=${data.data.conference.conferenceCode}`;
            
        } else {
            // Handle validation errors
            if (data.errors) {
                data.errors.forEach(error => {
                    const errorField = `${error.field}Error`;
                    const errorElement = document.getElementById(errorField);
                    if (errorElement) {
                        errorElement.textContent = error.message;
                    }
                });
            } else {
                alert(data.message || 'Failed to create conference');
            }
            
            // Go back to form step
            showStep(2);
        }
        
    } catch (error) {
        console.error('Conference creation error:', error);
        alert('Network error. Please try again.');
        showStep(2);
    }
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = 'signin_signup.html';
}

function joinCommittees() {
    alert('Join Committees functionality is not yet implemented.');
}

function viewCommittees() {
    alert('View Committees functionality is not yet implemented.');
}

function viewConferences() {
    alert('View Conferences functionality is not yet implemented.');
}

function viewResources() {
    alert('View Resources functionality is not yet implemented.');
}

window.createCommittees = createCommittees;
window.viewProfile = viewProfile;
window.logout = logout;
window.joinCommittees = joinCommittees;
window.viewCommittees = viewCommittees;
window.viewConferences = viewConferences;
window.viewResources = viewResources;
