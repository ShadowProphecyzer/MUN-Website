// Amendment page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated immediately
    checkAuthStatus();
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
    let currentParticipant = null;
    let participantLoaded = false;

    // Only show button for allowed roles
    const allowedRoles = ['god', 'owner', 'administrator', 'delegate'];
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
                alert('User info is still loading. Please wait a moment and try again.');
                return;
            }
            setModalUserInfo(currentParticipant);
            if (modal) modal.style.display = 'flex';
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
        }
    })();

    const form = document.getElementById('addAmendmentForm');
    const numberInput = document.getElementById('amendmentNumber');
    const letterInput = document.getElementById('amendmentLetter');
    const romanInput = document.getElementById('amendmentRoman');
    const contentInput = document.getElementById('amendmentContent');
    const friendlyInput = document.getElementById('amendmentFriendly');
    const mainPanel = document.querySelector('.amendment-details-card');

    // Helper: Validate roman numeral
    function isValidRoman(str) {
        return /^[IVXLCDMivxlcdm]+$/.test(str.trim());
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
            panel.className = 'amendment-subpanel';
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
                </div>
                <div class="amendment-subpanel-content">${am.content}</div>
            `;
            insertAfter.parentNode.insertBefore(panel, insertAfter.nextSibling);
            insertAfter = panel;
        });
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
    // Initial fetch
    fetchAndRenderAmendments();

    // Form submission
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            // Validate fields
            const number = parseInt(numberInput.value, 10);
            const letter = letterInput.value.trim();
            const roman = romanInput.value.trim();
            const content = contentInput.value.trim();
            const friendly = friendlyInput.checked;
            if (!number || !letter || letter.length !== 1 || !roman || !isValidRoman(roman) || !content) {
                alert('Please fill all fields correctly.');
                return;
            }
            const code = getConferenceCodeFromURL();
            // POST to backend
            const res = await apiCall(`/api/amendments/${code}`, {
                method: 'POST',
                body: JSON.stringify({ number, letter, roman, content, friendly })
            });
            if (res.response.ok && res.data.success) {
                // Close modal, clear form
                modal.style.display = 'none';
                form.reset();
                // Live update
                fetchAndRenderAmendments();
            } else {
                alert(res.data.message || 'Failed to add amendment.');
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
                    // Remove displayUserInfo and related role/country logic
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
