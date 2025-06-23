// public/js/sideMenu.js

const sideMenu = document.querySelector('.side-menu');
const toggleBtn = document.querySelector('#side-menu-toggle');
const menuItems = document.querySelectorAll('.menu-item');

// Initially closed or open based on preference
let isOpen = true;

function toggleMenu() {
  isOpen = !isOpen;
  if (isOpen) {
    sideMenu.classList.add('open');
    sideMenu.classList.remove('closed');
  } else {
    sideMenu.classList.remove('open');
    sideMenu.classList.add('closed');
  }
}

// Attach toggle button click
toggleBtn.addEventListener('click', toggleMenu);

// Navigation: show selected section & animate
menuItems.forEach(item => {
  item.addEventListener('click', () => {
    // Remove active from all menu items
    menuItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    // Get target section from data attribute
    const sectionId = item.dataset.section;
    showSection(sectionId);
  });
});

function showSection(id) {
  // Hide all sections
  document.querySelectorAll('.section').forEach(sec => {
    sec.classList.remove('active');
  });

  // Show target section
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
  }
}
