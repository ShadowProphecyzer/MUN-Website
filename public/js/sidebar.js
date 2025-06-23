// sidebar.js

// Toggle the sidebar open/closed
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('collapsed');
}

// Show the selected section and hide the others
function navigateTo(sectionId) {
  const allSections = document.querySelectorAll('.page-section');
  allSections.forEach(section => {
    section.classList.add('hidden');
    section.classList.remove('active');
  });

  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('active');
  }
}
