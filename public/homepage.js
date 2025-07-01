document.addEventListener('DOMContentLoaded', function() {
    const categories = document.querySelectorAll('.category');
    const showcase = document.getElementById('category-showcase');
  
    const munContent = {
      "category 1": {
        imgSrc: 'attatchments/general-assembly.jpg',
        title: 'General Assembly',
        description: 'The main deliberative, policymaking and representative organ of the United Nations.',
        buttonText: 'SIGN-UP',
        tags: 'Learn More | Contact Us'
      },
      "category 2": {
        imgSrc: 'attatchments/security-council.jpg',
        title: 'Security Council',
        description: 'Responsible for maintaining international peace and security.',
        buttonText: 'SIGN-UP',
        tags: 'Learn More | Contact Us'
      },
      "category 3": {
        imgSrc: 'attatchments/economic-council.jpg',
        title: 'Economic and Social Council',
        description: 'Coordinates economic, social, and related work of UN specialized agencies.',
        buttonText: 'SIGN-UP',
        tags: 'Learn More | Contact Us'
      },
      "category 4": {
        imgSrc: 'attatchments/human-rights.jpg',
        title: 'Human Rights Council',
        description: 'Address global human rights challenges and promote fundamental freedoms worldwide.',
        buttonText: 'SIGN-UP',
        tags: 'Learn More | Contact Us'
      },
      "category 5": {
        imgSrc: 'attatchments/environment.jpg',
        title: 'Environment Committee',
        description: 'Focus on environmental protection and sustainable development issues.',
        buttonText: 'SIGN-UP',
        tags: 'Learn More | Contact Us'
      },
      "category 6": {
        imgSrc: 'attatchments/disarmament.jpg',
        title: 'Disarmament Committee',
        description: 'Address global disarmament and non-proliferation challenges.',
        buttonText: 'SIGN-UP',
        tags: 'Learn More | Contact Us'
      },
      "category 7": {
        imgSrc: 'attatchments/specialized-agencies.jpg',
        title: 'Specialized Agencies',
        description: 'UN specialized agencies addressing specific global challenges.',
        buttonText: 'SIGN-UP',
        tags: 'Learn More | Contact Us'
      }
    };
  
    categories.forEach(function(category) {
      category.addEventListener('click', function() {
        categories.forEach(cat => cat.classList.remove('active'));
        category.classList.add('active');
  
        const selected = category.dataset.category;
        const content = munContent[selected];
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

    // Navigation button event listeners for CSP compliance
    const signInBtn = document.querySelector('.sign-in-btn');
    if (signInBtn) signInBtn.addEventListener('click', function(e) {
        // e.preventDefault(); // Uncomment if you want to handle with JS only
        // alert('Sign In clicked!');
        // window.location.href = 'signin_signup.html';
    });
    const signUpBtn = document.querySelector('.sign-up-btn');
    if (signUpBtn) signUpBtn.addEventListener('click', function(e) {
        // e.preventDefault();
        // alert('Sign Up clicked!');
        // window.location.href = 'signin_signup.html';
    });
    const heroSignUpBtn = document.querySelector('.hero-signup-btn');
    if (heroSignUpBtn) heroSignUpBtn.addEventListener('click', function(e) {
        // e.preventDefault();
        // alert('Hero Sign Up clicked!');
        // window.location.href = 'signin_signup.html';
    });
    const showcaseSignUpBtn = document.querySelector('.showcase-signup-btn');
    if (showcaseSignUpBtn) showcaseSignUpBtn.addEventListener('click', function(e) {
        // e.preventDefault();
        // alert('Showcase Sign Up clicked!');
        // window.location.href = 'signin_signup.html';
    });
  });