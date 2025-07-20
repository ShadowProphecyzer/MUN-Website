// Dashboard page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard page loaded successfully');
    
    // Check if user is authenticated
    checkAuthStatus();
    
    // Add event listeners for dashboard functions
    setupDashboardEvents();

    // Setup code entry panel events
    setupCodeEntryPanel();

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
        name: document.getElementById('conferenceName').value.trim(),
        committeeName: document.getElementById('committeeName').value.trim(),
        committeeIssue: document.getElementById('committeeIssue').value.trim()
    };
    // Basic validation
    let hasErrors = false;
    if (!formData.name) {
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
            // Redirect to new conference page
            window.location.href = `conference.html?code=${data.data.code}`;
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
    showCodeEntryPanel();
}

function viewCommittees() {
    window.location.href = 'my_committees.html';
}

function viewConferences() {
    alert('View Conferences functionality is not yet implemented.');
}

function viewResources() {
    alert('View Resources functionality is not yet implemented.');
}

// Conference Code Entry Panel Functions
function setupCodeEntryPanel() {
    const codeEntryForm = document.getElementById('codeEntryForm');
    const cancelBtn = document.querySelector('.cancel-code-btn');
    const codeInput = document.getElementById('conferenceCode');

    if (codeEntryForm) {
        codeEntryForm.addEventListener('submit', handleCodeSubmission);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideCodeEntryPanel);
    }

    if (codeInput) {
        // Only allow digits
        codeInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });

        // Handle Enter key
        codeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleCodeSubmission(e);
            }
        });
    }

    // Add Escape key to close panel
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const panel = document.getElementById('codeEntryPanel');
            if (panel && panel.style.display === 'flex') {
                hideCodeEntryPanel();
            }
        }
    });
}

// Show the code entry panel
function showCodeEntryPanel() {
    const panel = document.getElementById('codeEntryPanel');
    const codeInput = document.getElementById('conferenceCode');
    const messageDiv = document.getElementById('codeEntryMessage');
    
    if (panel) {
        panel.style.display = 'flex';
        // Clear previous messages
        if (messageDiv) {
            messageDiv.style.display = 'none';
            messageDiv.className = '';
            messageDiv.textContent = '';
        }
        // Focus on input
        if (codeInput) {
            codeInput.value = '';
            codeInput.focus();
        }
        
        // Add click outside to close functionality
        panel.addEventListener('click', function(e) {
            if (e.target === panel) {
                hideCodeEntryPanel();
            }
        });
    }
}

// Hide the code entry panel
function hideCodeEntryPanel() {
    const panel = document.getElementById('codeEntryPanel');
    if (panel) {
        panel.style.display = 'none';
    }
}

// Handle code submission
async function handleCodeSubmission(event) {
    event.preventDefault();
    
    const codeInput = document.getElementById('conferenceCode');
    const messageDiv = document.getElementById('codeEntryMessage');
    const submitBtn = document.querySelector('.submit-code-btn');
    
    if (!codeInput || !messageDiv || !submitBtn) return;
    
    const code = codeInput.value.trim();
    
    // Basic validation
    if (!code) {
        showMessage('Please enter a conference code.', 'error');
        return;
    }
    
    if (!/^\d{12}$/.test(code)) {
        showMessage('Conference code must be exactly 12 digits.', 'error');
        return;
    }
    
    // Disable submit button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = 'Validating...';
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/conference/validate-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ code })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showMessage(`Successfully joined ${data.data.name} - ${data.data.committeeName}!`, 'success');
            // Redirect to the conference page after a short delay
            setTimeout(() => {
                window.location.href = `conference.html?code=${code}`;
            }, 2000);
        } else {
            showMessage(data.message || 'Failed to join conference.', 'error');
            // Start 3-second cooldown with countdown
            startCooldown(submitBtn, 3);
        }
    } catch (error) {
        console.error('Code validation error:', error);
        showMessage('Network error. Please try again.', 'error');
        // Start 3-second cooldown with countdown
        startCooldown(submitBtn, 3);
    }
}

// Start cooldown with countdown timer
function startCooldown(button, seconds) {
    let remaining = seconds;
    button.disabled = true;
    
    const countdown = setInterval(() => {
        remaining--;
        if (remaining > 0) {
            button.textContent = `Try again in ${remaining}s`;
        } else {
            clearInterval(countdown);
            button.disabled = false;
            button.textContent = 'Join Committee';
        }
    }, 1000);
    
    // Initial display
    button.textContent = `Try again in ${remaining}s`;
}

// Show message in the panel
function showMessage(message, type) {
    const messageDiv = document.getElementById('codeEntryMessage');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = type;
        messageDiv.style.display = 'block';
    }
}

window.createCommittees = createCommittees;
window.viewProfile = viewProfile;
window.logout = logout;
window.joinCommittees = joinCommittees;
window.viewCommittees = viewCommittees;
window.viewConferences = viewConferences;
window.viewResources = viewResources;
