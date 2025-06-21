document.addEventListener('DOMContentLoaded', function() {
  const categories = document.querySelectorAll('.category');
  const showcase = document.getElementById('category-showcase');

  const productContent = {
    "category 1": {
      imgSrc: '../attachments/earring.jpg',
      title: 'Earrings',
      description: 'Explore our beautiful collection of earrings.',
      buttonText: 'SIGN-UP',
      tags: 'Learn More | Contact Us'
    },
    "category 2": {
      imgSrc: '../attachments/bracelet.jpg',
      title: 'Bracelets',
      description: 'Browse our unique bracelet collection.',
      buttonText: 'SIGN-UP',
      tags: 'Learn More | Contact Us'
    },
    "category 3": {
      imgSrc: '../attachments/brooch.jpg',
      title: 'Brooches',
      description: 'Stylish brooches to complete your look.',
      buttonText: 'SIGN-UP',
      tags: 'Learn More | Contact Us'
    },
    "category 4": {
      imgSrc: '../attachments/necklace.jpg',
      title: 'Necklaces',
      description: 'Elegant necklaces for every occasion.',
      buttonText: 'SIGN-UP',
      tags: 'Learn More | Contact Us'
    },
    "category 5": {
      imgSrc: '../attachments/pendant.jpg',
      title: 'Pendants',
      description: 'Gorgeous pendants to elevate your style.',
      buttonText: 'SIGN-UP',
      tags: 'Learn More | Contact Us'
    },
    "category 6": {
      imgSrc: '../attachments/ring.jpg',
      title: 'Rings',
      description: 'Exquisite rings for any occasion.',
      buttonText: 'SIGN-UP',
      tags: 'Learn More | Contact Us'
    },
    "category 7": {
      imgSrc: '../attachments/chain.jpg',
      title: 'Chains',
      description: 'Smooth chains for beauty.',
      buttonText: 'SIGN-UP',
      tags: 'Learn More | Contact Us'
    }
  };

  categories.forEach(function(category) {
    category.addEventListener('click', function() {
      categories.forEach(cat => cat.classList.remove('active'));
      category.classList.add('active');

      const selected = category.dataset.category;
      const content = productContent[selected];
      if (!content) return;

      showcase.style.opacity = 0;

      setTimeout(() => {
        showcase.querySelector('.showcase-image').src = content.imgSrc;
        showcase.querySelector('h3').textContent = content.title;
        showcase.querySelector('p').textContent = content.description;
        showcase.querySelector('button').textContent = content.buttonText;
        showcase.querySelector('.tags').textContent = content.tags;
        showcase.style.opacity = 1;
      }, 300);
    });
  });
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
