const socket = io();
const countryList = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia (Plurinational State of)","Bosnia and Herzegovina","Botswana","Brazil","Brunei Darussalam","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Côte d'Ivoire","Croatia","Cuba","Cyprus","Czechia","Democratic People's Republic of Korea","Democratic Republic of the Congo","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran (Islamic Republic of)","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Lao People's Democratic Republic","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia (Federated States of)","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Macedonia","Norway","Oman","Pakistan","Palau","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Republic of Korea","Republic of Moldova","Romania","Russian Federation","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syrian Arab Republic","Tajikistan","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom of Great Britain and Northern Ireland","United Republic of Tanzania","United States of America","Uruguay","Uzbekistan","Vanuatu","Venezuela (Bolivarian Republic of)","Viet Nam","Yemen","Zambia","Zimbabwe"
];

let currentUser = null;
let currentRole = null;
let conferenceCode = null;

function getConferenceCodeFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('code');
}

async function fetchCurrentUser() {
  const res = await fetch('/api/auth/check', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
  });
  const data = await res.json();
  if (data.success && data.user) {
    currentUser = data.user;
    // Update nav bar username
    const navUser = document.getElementById('userName');
    if (navUser) navUser.textContent = currentUser.username;
  }
}

async function fetchParticipants() {
  const res = await fetch(`/api/participants/${conferenceCode}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
  });
  const data = await res.json();
  return data.success ? data.data : [];
}

function renderWelcomeMessage() {
  const welcomeElem = document.getElementById('welcomeMessage');
  if (welcomeElem && currentUser) {
    welcomeElem.innerHTML = `Hello, <span id="currentUsername">${currentUser.username}</span>`;
  }
}

function renderParticipants(participants) {
  const list = document.getElementById('participantsList');
  list.innerHTML = '';
  // Always show GOD and Owner first
  const sorted = [...participants].sort((a, b) => {
    if (a.role === 'GOD') return -1;
    if (b.role === 'GOD') return 1;
    if (a.role === 'Owner') return -1;
    if (b.role === 'Owner') return 1;
    return 0;
  });
  sorted.forEach(p => {
    let roleLabel = p.role.charAt(0).toUpperCase() + p.role.slice(1);
    if (p.role.toLowerCase() === 'delegate') {
      if (p.country && p.country.trim() !== '') {
        roleLabel += ` (${p.country})`;
      } else {
        console.log('[DEBUG] Delegate missing country:', p);
      }
    }
    const li = document.createElement('li');
    li.className = 'participant-item';
    li.innerHTML = `
      <div class="participant-avatar">${p.name[0].toUpperCase()}</div>
      <div class="participant-info">
        <div class="participant-name">${p.name}</div>
        <div class="participant-email">${p.email}</div>
      </div>
      <span class="role-label">${roleLabel}</span>
      <button class="remove-btn ${canRemove(p) ? '' : 'disabled'}" data-email="${p.email}" ${canRemove(p) ? '' : 'disabled'}>&times;</button>
    `;
    list.appendChild(li);
  });
  addDropdownListeners();
}

function roleOptions(selected, locked) {
  const roles = ['GOD','Owner','Administrator','Moderator','Chair','Delegate','Unassigned'];
  return roles.map(r => `<option value="${r.toLowerCase()}" ${selected.toLowerCase()===r.toLowerCase()?'selected':''} ${locked && (r==='GOD'||r==='Owner')?'disabled':''}>${r}</option>`).join('');
}

function canEditRole(p) {
  if (!currentRole) return false;
  if (p.isLocked) return false;
  if (['GOD','Owner'].includes(currentRole)) return true;
  if (currentRole==='Administrator' && !['GOD','Owner','Administrator'].includes(p.role)) return true;
  return false;
}

function canRemove(p) {
  console.log('[DEBUG] canRemove check for:', p.email, 'role:', p.role, 'locked:', p.isLocked);
  console.log('[DEBUG] Current user role:', currentRole);
  
  if (!currentRole) {
    console.log('[DEBUG] No current role - cannot remove');
    return false;
  }
  if (p.isLocked) {
    console.log('[DEBUG] Participant is locked - cannot remove');
    return false;
  }
  if (['GOD','Owner'].includes(currentRole)) {
    console.log('[DEBUG] GOD/Owner can remove anyone');
    return true;
  }
  if (currentRole.toLowerCase()==='administrator') {
    // Administrators cannot remove any administrators (including themselves)
    if (p.role.toLowerCase()==='administrator') {
      console.log('[DEBUG] Administrator cannot remove another administrator');
      return false;
    }
    console.log('[DEBUG] Administrator can remove this participant');
    return true;
  }
  console.log('[DEBUG] Cannot remove - insufficient permissions');
  return false;
}

function addDropdownListeners() {
  document.querySelectorAll('.role-dropdown').forEach(sel => {
    sel.addEventListener('change', async function() {
      const email = this.getAttribute('data-email');
      const role = this.value;
      if (!confirm(`Change role for ${email} to ${role}?`)) return;
      await fetch(`/api/participants/${conferenceCode}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        body: JSON.stringify({ email, role })
      });
    });
  });
  document.querySelectorAll('.country-dropdown').forEach(sel => {
    sel.addEventListener('change', async function() {
      const email = this.getAttribute('data-email');
      const country = this.value;
      if (!confirm(`Assign country ${country} to ${email}?`)) return;
      
      const res = await fetch(`/api/participants/${conferenceCode}/country`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        body: JSON.stringify({ email, country })
      });
      
      const data = await res.json();
      if (!data.success) {
        // Show specific error messages based on the response
        if (res.status === 403) {
          alert('❌ Permission Denied: You do not have permission to assign countries.');
        } else if (res.status === 400 && data.message.includes('Only delegates can have a country')) {
          alert('❌ Only delegates can be assigned countries. Please change the participant role to "Delegate" first.');
        } else if (res.status === 404) {
          alert('❌ Participant not found.');
        } else {
          alert(`❌ Error: ${data.message || 'Failed to assign country.'}`);
        }
      } else {
        // Success - the real-time update will handle the UI refresh
        console.log('[DEBUG] Country assigned successfully');
      }
    });
  });
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      // Don't process if button is disabled
      if (this.classList.contains('disabled') || this.hasAttribute('disabled')) {
        return;
      }
      
      const email = this.getAttribute('data-email');
      if (!confirm(`Remove ${email} from participants?`)) return;
      
      const res = await fetch(`/api/participants/${conferenceCode}/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      if (!data.success) {
        // Show specific error messages based on the response
        if (res.status === 403) {
          if (data.message.includes('Cannot remove GOD/Owner/Administrator')) {
            alert('❌ Cannot remove this participant. GOD, Owner, and Administrator roles are protected from removal.');
          } else {
            alert('❌ Permission Denied: You do not have permission to remove participants.');
          }
        } else if (res.status === 404) {
          alert('❌ Participant not found.');
        } else {
          alert(`❌ Error: ${data.message || 'Failed to remove participant.'}`);
        }
      } else {
        // Success - the real-time update will handle the UI refresh
        console.log('[DEBUG] Participant removed successfully');
      }
    });
  });
}

async function addParticipant(email, role, country = '') {
  if (!confirm(`Add ${email} as ${role}${role==='delegate' ? ' ('+country+')' : ''}?`)) return false;
  const body = { email, role };
  if (role === 'delegate') body.country = country;
  const res = await fetch(`/api/participants/${conferenceCode}/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!data.success) {
    alert(data.message || 'Failed to add participant.');
    return false;
  }
  return true;
}

document.addEventListener('DOMContentLoaded', async function() {
  conferenceCode = getConferenceCodeFromURL();
  await fetchCurrentUser();
  renderWelcomeMessage();
  // Get current user's role in this conference
  let participants = await fetchParticipants();
  console.log('[DEBUG] All participants from API:', participants);
  console.log('[DEBUG] Current user email:', currentUser.email);
  const me = participants.find(p => p.email === currentUser.email);
  console.log('[DEBUG] Found participant in list:', me);
  currentRole = me ? me.role : null;
  
  // Debug logging
  console.log('[DEBUG] Current user email:', currentUser.email);
  console.log('[DEBUG] Found participant:', me);
  console.log('[DEBUG] Current role:', currentRole);
  console.log('[DEBUG] All participants:', participants);
  
  renderParticipants(participants);

  const countrySelect = document.getElementById('addCountrySelect');
  const roleSelect = document.getElementById('addRoleSelect');
  // Populate country dropdown
  countrySelect.innerHTML = '<option value="">Select Country</option>' + countryList.map(c => `<option value="${c}">${c}</option>`).join('');
  // Show/hide country dropdown based on role
  roleSelect.addEventListener('change', function() {
    if (roleSelect.value === 'delegate') {
      countrySelect.style.display = '';
    } else {
      countrySelect.style.display = 'none';
      countrySelect.value = '';
    }
  });

  // Add participant
  document.getElementById('addParticipantBtn').onclick = async function() {
    const input = document.getElementById('addParticipantInput');
    const roleSel = document.getElementById('addRoleSelect');
    const countrySel = document.getElementById('addCountrySelect');
    const emails = input.value.split(',').map(e => e.trim()).filter(Boolean);
    for (const email of emails) {
      let country = '';
      if (roleSel.value === 'delegate') {
        country = countrySel.value;
        if (!country) {
          alert('Please select a country for the delegate.');
          return;
        }
      }
      const ok = await addParticipant(email, roleSel.value, country);
      if (ok) {
        participants = await fetchParticipants();
        renderParticipants(participants);
      }
    }
    input.value = '';
    countrySel.value = '';
  };
  // Fix return to conference page button
  document.querySelectorAll('.return-conference-btn').forEach(btn => {
    btn.onclick = function() {
      window.location.href = `conference.html?code=${conferenceCode}`;
    };
  });

  // Real-time updates
  socket.emit('joinConference', conferenceCode);
  socket.on('participantsUpdate', async () => {
    const updated = await fetchParticipants();
    renderParticipants(updated);
  });

  // Logout
  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.onclick = function() {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      window.location.href = 'signin_signup.html';
    };
  });
});