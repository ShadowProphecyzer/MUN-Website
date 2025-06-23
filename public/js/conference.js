// public/js/conference.js
import {
  joinConference as socketJoinConference,
} from './socket.js';

// Utility: get token from localStorage (you should store token on login)
function getToken() {
  return localStorage.getItem('token');
}

// Headers with auth token
function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

// Show/hide country dropdown based on role selection
const joinRoleSelect = document.getElementById('joinRole');
const countryContainer = document.getElementById('countryContainer');

joinRoleSelect.addEventListener('change', () => {
  if (joinRoleSelect.value === '4') {
    countryContainer.style.display = 'block';
  } else {
    countryContainer.style.display = 'none';
  }
});

// Create Conference
const createForm = document.getElementById('createConferenceForm');
const createResult = document.getElementById('createResult');

createForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  createResult.textContent = '';

  const name = createForm.confName.value.trim();
  if (name.length < 3) {
    createResult.textContent = 'Conference name must be at least 3 characters.';
    createResult.className = 'result-msg error';
    return;
  }

  try {
    const res = await fetch('/api/conference/create', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });

    const data = await res.json();

    if (res.ok) {
      createResult.textContent = `Conference created! Code: ${data.conference.code}`;
      createResult.className = 'result-msg success';

      // Auto join socket room
      socketJoinConference(data.conference._id);
      
      // Optionally redirect or update UI
    } else {
      createResult.textContent = data.message || 'Error creating conference';
      createResult.className = 'result-msg error';
    }
  } catch (err) {
    createResult.textContent = 'Network error. Try again later.';
    createResult.className = 'result-msg error';
  }
});

// Join Conference
const joinForm = document.getElementById('joinConferenceForm');
const joinResult = document.getElementById('joinResult');

joinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  joinResult.textContent = '';

  const code = joinForm.joinCode.value.trim().toUpperCase();
  const role = joinForm.joinRole.value;
  const country = joinForm.countrySelect.value.trim();

  if (code.length !== 6) {
    joinResult.textContent = 'Conference code must be 6 characters.';
    joinResult.className = 'result-msg error';
    return;
  }

  if (role === '4' && country === '') {
    joinResult.textContent = 'Delegates must select a country.';
    joinResult.className = 'result-msg error';
    return;
  }

  try {
    const res = await fetch('/api/conference/join', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ code, role: Number(role), country }),
    });

    const data = await res.json();

    if (res.ok) {
      joinResult.textContent = `Joined conference: ${data.conference.name}`;
      joinResult.className = 'result-msg success';

      // Join socket room for real-time updates
      socketJoinConference(data.conference._id);

      // Optionally redirect or update UI
    } else {
      joinResult.textContent = data.message || 'Error joining conference';
      joinResult.className = 'result-msg error';
    }
  } catch (err) {
    joinResult.textContent = 'Network error. Try again later.';
    joinResult.className = 'result-msg error';
  }
});
