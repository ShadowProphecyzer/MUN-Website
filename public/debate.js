document.addEventListener('DOMContentLoaded', function () {
    // Get conference code from URL
    function getConferenceCodeFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('code');
    }

    // Participant authentication check
    function isAuthenticated() {
        // Check for a valid auth token (used in other pages)
        return !!localStorage.getItem('authToken');
    }

    const code = getConferenceCodeFromURL();
    if (!isAuthenticated()) {
        window.location.href = 'signin_signup.html';
        return;
    }
    if (!code) {
        window.location.href = 'conference.html';
        return;
    }

    const addDebateBtn = document.querySelector('.add-debate-btn');
    const debateModal = document.getElementById('addDebateModal');
    const closeDebateModalBtn = document.querySelector('.debate-modal-close');
    const addDebateForm = document.getElementById('addDebateForm');
    const returnConferenceBtn = document.querySelector('.return-conference-btn');

    // Socket.io live updating
    const socket = io();

    // Listen for live debate updates (placeholder event)
    socket.on('debateUpdate', function (data) {
        // TODO: Update the debate UI with new data
        console.log('Live debate update received:', data);
        // Example: show a notification or update a list
    });

    // Emit a placeholder event when a new debate note is added (extend as needed)
    function emitDebateNote(note) {
        socket.emit('addDebateNote', note);
    }

    // Open modal
    addDebateBtn.addEventListener('click', function () {
        debateModal.style.display = 'flex';
    });

    // Close modal
    closeDebateModalBtn.addEventListener('click', function () {
        debateModal.style.display = 'none';
    });

    // Close modal when clicking outside modal content
    debateModal.addEventListener('click', function (event) {
        if (event.target === debateModal) {
            debateModal.style.display = 'none';
        }
    });

    // Placeholder submit handler
    addDebateForm.addEventListener('submit', function (event) {
        event.preventDefault();
        alert('Debate note submitted! (placeholder)');
        debateModal.style.display = 'none';
        addDebateForm.reset();
    });

    // Return to conference page (preserve code)
    returnConferenceBtn.addEventListener('click', function () {
        window.location.href = `conference.html?code=${code}`;
    });

    // Leave conference button (placeholder)
    const leaveConferenceBtn = document.querySelector('.leave-conference-btn');
    if (leaveConferenceBtn) {
        leaveConferenceBtn.addEventListener('click', function () {
            window.location.href = 'homepage.html';
        });
    }
});
