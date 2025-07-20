// Amendment page JavaScript

// Global function to re-render existing amendments when approval role is detected
function reRenderExistingAmendments() {
    if (typeof hasApprovalRole !== 'undefined' && hasApprovalRole) {
        console.log('Re-rendering existing amendments with approval role');
        // Get the fetchAndRenderAmendments function from the global scope
        if (typeof fetchAndRenderAmendments === 'function') {
            fetchAndRenderAmendments();
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Socket.IO
    const socket = io();
    let currentParticipant = null;
    let participantLoaded = false;
    let hasApprovalRole = false;
    let currentUser = null;
    
    // Make hasApprovalRole globally accessible
    window.hasApprovalRole = hasApprovalRole;
    
    // Check if user is authenticated immediately
    checkAuthStatus();
    
    // Join conference room for real-time updates
    const code = getConferenceCodeFromURL();
    if (code) {
        socket.emit('joinConference', code);
    }
    
    // Listen for amendment updates
    socket.on('amendmentUpdate', async () => {
        console.log('Amendment update received, refreshing...');
        await fetchAndRenderAmendments();
    });
    
    // Add event listener for return to conference button
    const returnBtn = document.querySelector('.return-conference-btn');
    if (returnBtn) {
        const code = getConferenceCodeFromURL();
        returnBtn.addEventListener('click', function() {
            window.location.href = `conference.html?code=${code}`;
        });
    }

    // Add Amendment Modal logic
    const addBtn = document.querySelector('.add-amendment-btn');
    const modal = document.getElementById('addAmendmentModal');
    const closeModalBtn = document.querySelector('.amendment-modal-close');
    const userRoleSpan = document.getElementById('modalUserRole');
    const userCountrySpan = document.getElementById('modalUserCountry');

    // Only show button for allowed roles
    const allowedRoles = ['god', 'owner', 'administrator', 'delegate'];
    const approvalRoles = ['god', 'owner', 'administrator', 'chair'];
    
    function setAddButtonVisibility(participant) {
        if (!addBtn) return;
        if (participant && allowedRoles.includes(participant.role.toLowerCase())) {
            addBtn.style.display = '';
            addBtn.disabled = false;
        } else {
            addBtn.style.display = 'none';
            addBtn.disabled = true;
        }
    }
    
    function setApprovalRole(participant) {
        hasApprovalRole = participant && approvalRoles.includes(participant.role.toLowerCase());
        // If we have user data but no participant yet, check user role
        if (!hasApprovalRole && currentUser && currentUser.role) {
            hasApprovalRole = approvalRoles.includes(currentUser.role.toLowerCase());
        }
        // Update global variable
        window.hasApprovalRole = hasApprovalRole;
    }

    function setModalUserInfo(participant) {
        if (!participant) {
            userRoleSpan.textContent = 'Role: [Loading failed]';
            userCountrySpan.style.display = 'none';
            return;
        }
        userRoleSpan.textContent = `Role: ${participant.role}`;
        if (participant.role.toLowerCase() === 'delegate' && participant.country) {
            userCountrySpan.style.display = '';
            userCountrySpan.textContent = `Country: ${participant.country}`;
        } else {
            userCountrySpan.style.display = 'none';
        }
        // Always enable form fields if participant info is present
        form && (form.querySelectorAll('input,textarea,button').forEach(el => el.disabled = false));
    }

    if (addBtn) {
        addBtn.addEventListener('click', function() {
            if (!participantLoaded) {
                showError('User info is still loading. Please wait a moment and try again.');
                return;
            }
            setModalUserInfo(currentParticipant);
            if (modal) {
                modal.style.display = 'flex';
                // Re-initialize form elements after modal is shown
                setTimeout(() => {
                    const numberInput = document.getElementById('amendmentNumber');
                    const letterInput = document.getElementById('amendmentLetter');
                    const romanInput = document.getElementById('amendmentRoman');
                    const actionTypeInput = document.getElementById('amendmentActionType');
                    const contentInput = document.getElementById('amendmentContent');
                    const friendlyInput = document.getElementById('amendmentFriendly');
                    
                    console.log('Modal form elements found:', {
                        numberInput: !!numberInput,
                        letterInput: !!letterInput,
                        romanInput: !!romanInput,
                        actionTypeInput: !!actionTypeInput,
                        contentInput: !!contentInput,
                        friendlyInput: !!friendlyInput
                    });
                }, 100);
            }
        });
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            if (modal) modal.style.display = 'none';
        });
    }
    // Close modal on outside click
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    // Fetch participant info for role/country and button visibility
    (async function fetchParticipantInfo() {
        const code = getConferenceCodeFromURL();
        if (!code) return;
        const authRes = await apiCall('/api/auth/check');
        if (!authRes.data || !authRes.data.user) return;
        const partRes = await apiCall(`/api/participants/${code}`);
        if (partRes.response.ok && partRes.data.success && Array.isArray(partRes.data.data)) {
            const userEmail = authRes.data.user.email.toLowerCase();
            // Debug logging
            console.log('Participants:', partRes.data.data);
            console.log('User email:', userEmail);
            currentParticipant = partRes.data.data.find(p => p.email.toLowerCase() === userEmail);
            participantLoaded = true;
            setAddButtonVisibility(currentParticipant);
            setApprovalRole(currentParticipant);
            currentUser = authRes.data.user; // Store user data
            reRenderExistingAmendments(); // Re-render existing amendments after participant info is loaded
        }
    })();

    const form = document.getElementById('addAmendmentForm');
    const numberInput = document.getElementById('amendmentNumber');
    const letterInput = document.getElementById('amendmentLetter');
    const romanInput = document.getElementById('amendmentRoman');
    const actionTypeInput = document.getElementById('amendmentActionType');
    const contentInput = document.getElementById('amendmentContent');
    const friendlyInput = document.getElementById('amendmentFriendly');
    const mainPanel = document.querySelector('.amendment-details-card');

    // Debug: Check if elements are found
    console.log('Form elements found:', {
        numberInput: !!numberInput,
        letterInput: !!letterInput,
        romanInput: !!romanInput,
        actionTypeInput: !!actionTypeInput,
        contentInput: !!contentInput,
        friendlyInput: !!friendlyInput
    });
    
    // Helper: Validate roman numeral
    function isValidRoman(str) {
        return /^[IVXLCDMivxlcdm]+$/.test(str.trim());
    }
    
    // Helper: Get action type display text
    function getActionTypeDisplayText(actionType) {
        switch(actionType) {
            case 'add': return 'Add';
            case 'modify': return 'Modify';
            case 'strike': return 'Strike';
            default: return actionType;
        }
    }
    
    // Helper: Get status color class
    function getStatusColorClass(status) {
        switch(status) {
            case 'passed': return 'status-passed';
            case 'rejected': return 'status-rejected';
            case 'debating': return 'status-debating';
            case 'on_hold': return 'status-on-hold';
            default: return 'status-on-hold';
        }
    }
    
    // Helper: Get status display text
    function getStatusDisplayText(status) {
        switch(status) {
            case 'passed': return 'Passed';
            case 'rejected': return 'Rejected';
            case 'debating': return 'Debating';
            case 'on_hold': return 'On Hold';
            default: return 'On Hold';
        }
    }
    
    // Create status confirmation modal
    function createStatusModal() {
        const modal = document.createElement('div');
        modal.id = 'statusModal';
        modal.className = 'status-modal';
        modal.innerHTML = `
            <div class="status-modal-content">
                <h3>Update Amendment Status</h3>
                <p id="statusModalMessage">Are you sure you want to change the status?</p>
                <div class="status-modal-buttons">
                    <button id="statusModalConfirm" class="status-modal-confirm">Confirm</button>
                    <button id="statusModalCancel" class="status-modal-cancel">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }
    
    // Show status confirmation modal
    function showStatusConfirmation(currentStatus, newStatus, amendmentId, callback) {
        let modal = document.getElementById('statusModal');
        if (!modal) {
            modal = createStatusModal();
        }
        
        const message = document.getElementById('statusModalMessage');
        message.textContent = `Are you sure you want to change the status from "${getStatusDisplayText(currentStatus)}" to "${getStatusDisplayText(newStatus)}"?`;
        
        modal.style.display = 'flex';
        
        const confirmBtn = document.getElementById('statusModalConfirm');
        const cancelBtn = document.getElementById('statusModalCancel');
        
        const cleanup = () => {
            modal.style.display = 'none';
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };
        
        const handleConfirm = () => {
            cleanup();
            callback();
        };
        
        const handleCancel = () => {
            cleanup();
        };
        
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
    }
    
    // Update amendment status
    async function updateAmendmentStatus(amendmentId, newStatus) {
        const code = getConferenceCodeFromURL();
        if (!code) return;
        
        try {
            const res = await apiCall(`/api/amendments/${code}/${amendmentId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });
            
            if (res.response.ok && res.data.success) {
                console.log('Status updated successfully');
                // Real-time update will be handled by WebSocket
            } else {
                showError(res.data.message || 'Failed to update status.');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            showError('Failed to update status.');
        }
    }

    // Render amendments in the main panel
    function renderAmendments(amendments) {
        // Remove old amendment sub-panels
        const oldPanels = mainPanel.querySelectorAll('.amendment-subpanel');
        oldPanels.forEach(p => p.remove());
        // Insert after the h2 (or after the p if present)
        let insertAfter = mainPanel.querySelector('h2')?.nextElementSibling || mainPanel.querySelector('h2');
        amendments.forEach(am => {
            const panel = document.createElement('div');
            panel.className = `amendment-subpanel ${getStatusColorClass(am.status)}`;
            panel.innerHTML = `
                <div class="amendment-subpanel-header">
                  <span class="amendment-id">#${am.amendmentId}</span>
                  <span class="amendment-user">${am.user.username} (${am.user.role}${am.user.country ? ', ' + am.user.country : ''})</span>
                  <span class="amendment-friendly">${am.friendly ? 'Friendly' : 'Unfriendly'}</span>
                </div>
                <div class="amendment-subpanel-fields">
                  <span><b>Number:</b> ${am.number}</span>
                  <span><b>Letter:</b> ${am.letter}</span>
                  <span><b>Roman:</b> ${am.roman}</span>
                  <span><b>Action:</b> ${getActionTypeDisplayText(am.actionType || 'N/A')}</span>
                </div>
                <div class="amendment-subpanel-content">${am.content}</div>
                ${hasApprovalRole ? `
                <div class="amendment-status-buttons">
                  <button class="status-btn status-passed" data-status="passed" data-amendment-id="${am.amendmentId}">Passed</button>
                  <button class="status-btn status-rejected" data-status="rejected" data-amendment-id="${am.amendmentId}">Rejected</button>
                  <button class="status-btn status-debating" data-status="debating" data-amendment-id="${am.amendmentId}">Debating</button>
                  <button class="status-btn status-on-hold" data-status="on_hold" data-amendment-id="${am.amendmentId}">On Hold</button>
                </div>
                ` : ''}
            `;
            insertAfter.parentNode.insertBefore(panel, insertAfter.nextSibling);
            insertAfter = panel;
        });
        
        // Add event listeners to status buttons
        if (hasApprovalRole) {
            const statusButtons = document.querySelectorAll('.status-btn');
            statusButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const amendmentId = this.getAttribute('data-amendment-id');
                    const newStatus = this.getAttribute('data-status');
                    const currentStatus = this.closest('.amendment-subpanel').classList.contains('status-passed') ? 'passed' :
                                        this.closest('.amendment-subpanel').classList.contains('status-rejected') ? 'rejected' :
                                        this.closest('.amendment-subpanel').classList.contains('status-debating') ? 'debating' : 'on_hold';
                    
                    if (currentStatus === newStatus) {
                        return; // No change needed
                    }
                    
                    showStatusConfirmation(currentStatus, newStatus, amendmentId, () => {
                        updateAmendmentStatus(amendmentId, newStatus);
                    });
                });
            });
        }
    }

    // Fetch and display amendments
    async function fetchAndRenderAmendments() {
        const code = getConferenceCodeFromURL();
        if (!code) return;
        const res = await apiCall(`/api/amendments/${code}`);
        if (res.response.ok && res.data.success && Array.isArray(res.data.data)) {
            renderAmendments(res.data.data);
        }
    }
    
    // Make fetchAndRenderAmendments globally accessible
    window.fetchAndRenderAmendments = fetchAndRenderAmendments;
    
    // Initial fetch
    fetchAndRenderAmendments();

    // Form submission
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form elements fresh
            const numberInput = document.getElementById('amendmentNumber');
            const letterInput = document.getElementById('amendmentLetter');
            const romanInput = document.getElementById('amendmentRoman');
            const actionTypeInput = document.getElementById('amendmentActionType');
            const contentInput = document.getElementById('amendmentContent');
            const friendlyInput = document.getElementById('amendmentFriendly');
            
            // Validate fields
            const number = parseInt(numberInput.value, 10);
            const letter = letterInput.value.trim();
            const roman = romanInput.value.trim();
            const actionType = actionTypeInput ? actionTypeInput.value : '';
            const content = contentInput.value.trim();
            const friendly = friendlyInput.checked;
            
            // Debug: Log form values
            console.log('Form values:', {
                number,
                letter,
                roman,
                actionType,
                content,
                friendly
            });
            
            if (!number || !letter || letter.length !== 1 || !roman || !isValidRoman(roman) || !actionType || !content) {
                console.log('Validation failed:', {
                    number: !number,
                    letter: !letter || letter.length !== 1,
                    roman: !roman || !isValidRoman(roman),
                    actionType: !actionType,
                    content: !content
                });
                showError('Please fill all fields correctly.');
                return;
            }
            const code = getConferenceCodeFromURL();
            // POST to backend
            const res = await apiCall(`/api/amendments/${code}`, {
                method: 'POST',
                body: JSON.stringify({ number, letter, roman, actionType, content, friendly })
            });
            if (res.response.ok && res.data.success) {
                // Close modal, clear form
                modal.style.display = 'none';
                form.reset();
                // Live update
                fetchAndRenderAmendments();
            } else {
                showError(res.data.message || 'Failed to add amendment.');
            }
        });
    }
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
        const newToken = response.headers.get('X-New-Token');
        if (newToken) {
            localStorage.setItem('authToken', newToken);
        }
        const data = await response.json();
        if (data.token) {
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
                // Fetch participant info for this conference
                const code = getConferenceCodeFromURL();
                if (!code) return;
                const partRes = await apiCall(`/api/participants/${code}`);
                if (partRes.response.ok && partRes.data.success && Array.isArray(partRes.data.data)) {
                    const participants = partRes.data.data;
                    const userEmail = data.user.email.toLowerCase();
                    const currentParticipant = participants.find(p => p.email.toLowerCase() === userEmail);
                    if (!currentParticipant) {
                        showNotParticipantMessage();
                        return;
                    }
                    // Set approval role immediately if user has a role
                    if (data.user.role) {
                        const approvalRoles = ['god', 'owner', 'administrator', 'chair'];
                        hasApprovalRole = approvalRoles.includes(data.user.role.toLowerCase());
                        console.log('Set approval role from auth data:', hasApprovalRole, 'for role:', data.user.role);
                        // Re-render existing amendments if we now have approval role
                        if (hasApprovalRole) {
                            setTimeout(() => reRenderExistingAmendments(), 100);
                        }
                    }
                } else {
                    showNotParticipantMessage();
                    return;
                }
            }
        } else {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                window.location.href = 'signin_signup.html';
            }
        }
    } catch (error) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = 'signin_signup.html';
    }
}

function getConferenceCodeFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('code');
}

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
        const returnDashboardBtn = mainContent.querySelector('.return-dashboard-btn');
        if (returnDashboardBtn) {
            returnDashboardBtn.addEventListener('click', function() {
                window.location.href = 'dashboard.html';
            });
        }
    }
}

// Utility to show styled error messages
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 4000);
    } else {
        alert(message); // fallback
    }
}
