const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const content = document.getElementById('content');
const logoutModal = document.getElementById('logoutModal');
const confirmLogout = document.getElementById('confirmLogout');
const cancelLogout = document.getElementById('cancelLogout');

menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('active');
  menuToggle.classList.toggle('active');
});

const sectionContent = {
  dashboard: {
    title: 'Dashboard',
    body: 'Overview of your activities, stats, and shortcuts.'
  },
  profile: {
    title: 'Profile',
    body: 'Manage your personal information, preferences, and settings.'
  },
  messages: {
    title: 'Messages',
    body: 'Check your inbox, send messages, and manage conversations.'
  },
  settings: {
    title: 'Settings',
    body: 'Customize your application preferences and configurations.'
  },
  analytics: {
    title: 'Analytics',
    body: 'Explore graphs, reports, and insights from your data.'
  },
  help: {
    title: 'Help Center',
    body: 'Find answers, resources, and contact support.'
  }
};

// Sidebar link logic
document.querySelectorAll('.sidebar a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const section = link.dataset.section;

    if (section === 'logout') {
      logoutModal.style.display = 'flex';
    } else {
      if (sectionContent[section]) {
        content.innerHTML = `
          <h1>${sectionContent[section].title}</h1>
          <p>${sectionContent[section].body}</p>
        `;
      }
    }
  });
});

// Logout confirmation buttons
cancelLogout.addEventListener('click', () => {
  logoutModal.style.display = 'none';
  // Load dashboard
  content.innerHTML = `
    <h1>${sectionContent.dashboard.title}</h1>
    <p>${sectionContent.dashboard.body}</p>
  `;
});

confirmLogout.addEventListener('click', () => {
  // Redirect to logout page
  window.location.href = "../public_access/homepage/homepage.html"; // Change to your target page
});
