document.addEventListener('DOMContentLoaded', function() {
  const categories = document.querySelectorAll('.category');
  const showcase = document.getElementById('category-showcase');
  const showcaseImage = showcase.querySelector('.showcase-image');
  const showcaseTitle = showcase.querySelector('h3');
  const showcaseDescription = showcase.querySelector('p');
  const showcaseButton = showcase.querySelector('button');

  // Feature data for each category
  const featureData = {
    'real-time': {
      title: 'Real-Time Communication',
      description: 'Stay connected with instant messaging, moderated chat rooms, and live notifications. Our platform ensures seamless communication between delegates, chairs, and moderators.',
      image: '../attatchments/logo.jpg',
      buttonText: 'Start Chatting'
    },
    'voting': {
      title: 'Digital Voting System',
      description: 'Conduct secure, transparent voting sessions with real-time results. Track voting history, manage multiple voting rounds, and ensure democratic decision-making.',
      image: '../attatchments/logo.jpg',
      buttonText: 'View Voting'
    },
    'amendments': {
      title: 'Amendment Management',
      description: 'Streamline the amendment process with digital submission, review, and approval workflows. Track amendment status and maintain clear documentation.',
      image: '../attatchments/logo.jpg',
      buttonText: 'Submit Amendment'
    },
    'dashboard': {
      title: 'Conference Dashboard',
      description: 'Our comprehensive dashboard provides real-time updates, participant management, and seamless conference coordination. Track voting, amendments, and contributions all in one place.',
      image: '../attatchments/logo.jpg',
      buttonText: 'Get Started'
    },
    'contributions': {
      title: 'Contribution Tracking',
      description: 'Monitor delegate participation and contributions throughout the conference. Track speaking time, resolution submissions, and overall engagement metrics.',
      image: '../attatchments/logo.jpg',
      buttonText: 'Track Progress'
    },
    'notes': {
      title: 'Collaborative Notes',
      description: 'Take and share notes in real-time with other participants. Organize information by topic, delegate, or session for easy reference and collaboration.',
      image: '../attatchments/logo.jpg',
      buttonText: 'Start Notes'
    },
    'database': {
      title: 'Centralized Database',
      description: 'Access all conference materials, resolutions, and historical data in one centralized location. Maintain comprehensive records for future reference.',
      image: '../attatchments/logo.jpg',
      buttonText: 'Browse Database'
    }
  };

  // Function to update showcase content
  function updateShowcase(category) {
    const data = featureData[category];
    if (data) {
      showcaseImage.src = data.image;
      showcaseImage.alt = data.title;
      showcaseTitle.textContent = data.title;
      showcaseDescription.textContent = data.description;
      showcaseButton.textContent = data.buttonText;
    }
  }

  // Add click event listeners to categories
  categories.forEach(category => {
    category.addEventListener('click', function() {
      // Remove active class from all categories
      categories.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked category
      this.classList.add('active');
      
      // Update showcase content
      const categoryType = this.getAttribute('data-category');
      updateShowcase(categoryType);
    });
  });

  // Initialize with default category (dashboard)
  updateShowcase('dashboard');
});

// Dark/Light Mode Toggle
const toggleBtn = document.getElementById("toggleMode");
const stylesheetLink = document.getElementById("stylesheet");

// You should give your logos these IDs in the HTML:
const mainLogo = document.querySelector('.mun-logo'); // Optionally give it an <img> inside
const footerLogo = document.getElementById("footer-section-logo");

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const isDark = toggleBtn.classList.toggle("dark-btn");
    toggleBtn.textContent = isDark ? "☀" : "🌑";
    toggleBtn.setAttribute("title", isDark ? "Switch to light mode" : "Switch to dark mode");

    if (isDark) {
      stylesheetLink.setAttribute("href", "homepage-darkmode.css");
      if (mainLogo) mainLogo.style.backgroundImage = "url('../attachments/main-logo-dark.jpg')";
      if (footerLogo) footerLogo.src = "../attachments/footer-logo-dark.jpg";
    } else {
      stylesheetLink.setAttribute("href", "homepage-lightmode.css");
      if (mainLogo) mainLogo.style.backgroundImage = "url('../attachments/main-logo-light.jpg')";
      if (footerLogo) footerLogo.src = "../attachments/footer-logo-light.jpg";
    }
  });
}
