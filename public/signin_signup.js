const container = document.getElementById("container");
const registerBtn = document.getElementById("register");
const loginBtn = document.getElementById("login");

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");

const regUsername = document.getElementById("regUsername");
const regEmail = document.getElementById("regEmail");
const regPassword = document.getElementById("regPassword");
const regConfirmPassword = document.getElementById("regConfirmPassword");
const registerBtnSubmit = document.getElementById("registerBtn");
const registerMessage = document.getElementById("registerMessage");

const loginIdentifier = document.getElementById("loginIdentifier");
const loginPassword = document.getElementById("loginPassword");
const loginBtnSubmit = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");

// Password strength checker elements
const passwordStrength = document.getElementById("passwordStrength");
const strengthBar = document.getElementById("strengthBar");
const passwordRequirements = document.getElementById("passwordRequirements");

registerBtn.addEventListener("click", () => {
  container.classList.add("active");
});

loginBtn.addEventListener("click", () => {
  container.classList.remove("active");
});

// Password strength checker
regPassword.addEventListener("input", checkPasswordStrength);
regPassword.addEventListener("focus", () => {
  passwordStrength.classList.add("show");
});

regPassword.addEventListener("blur", () => {
  if (regPassword.value === "") {
    passwordStrength.classList.remove("show");
  }
});

function checkPasswordStrength() {
  const password = regPassword.value;
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  // Update requirement indicators
  Object.keys(requirements).forEach(req => {
    const requirementElement = document.querySelector(`[data-requirement="${req}"]`);
    const iconElement = requirementElement.querySelector('.requirement-icon');
    
    if (requirements[req]) {
      // Hide the requirement when met
      requirementElement.style.display = 'none';
    } else {
      // Show the requirement when not met
      requirementElement.style.display = 'flex';
      iconElement.textContent = '❌';
    }
  });

  // Calculate strength
  const metRequirements = Object.values(requirements).filter(Boolean).length;
  let strength = 'weak';
  let strengthClass = 'weak';

  if (metRequirements >= 5) {
    strength = 'strong';
    strengthClass = 'strong';
  } else if (metRequirements >= 4) {
    strength = 'good';
    strengthClass = 'good';
  } else if (metRequirements >= 3) {
    strength = 'fair';
    strengthClass = 'fair';
  } else {
    strength = 'weak';
    strengthClass = 'weak';
  }

  // Update strength bar
  strengthBar.className = `strength-fill ${strengthClass}`;
}

function checkAuthStatus() {
  const token = localStorage.getItem('authToken');
  if (token) {
    fetch('/api/auth/check', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.authenticated) {
        if (data.token) {
          console.log('Token refreshed automatically');
          localStorage.setItem('authToken', data.token);
        }
        
        if (data.user) {
          localStorage.setItem('userData', JSON.stringify(data.user));
        }
        
        console.log('User already authenticated, redirecting to dashboard');
        window.location.href = 'dashboard.html';
      } else {
        console.log('Token invalid, clearing storage');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    })
    .catch(error => {
      console.error('Auth check error:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.log('Network error during auth check, keeping current session');
        return;
      }
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    });
  }
}

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const formData = {
    username: regUsername.value.trim(),
    email: regEmail.value.trim(),
    password: regPassword.value,
    confirmPassword: regConfirmPassword.value
  };
  
  if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
    showMessage(registerMessage, "Please fill in all fields", "error");
    return;
  }
  
  if (formData.password !== formData.confirmPassword) {
    showMessage(registerMessage, "Passwords do not match", "error");
    return;
  }
  
  // Check password strength requirements
  const password = formData.password;
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  const metRequirements = Object.values(requirements).filter(Boolean).length;
  if (metRequirements < 3) {
    showMessage(registerMessage, "Password must meet at least 3 requirements (8+ chars, uppercase, lowercase, number, special char)", "error");
    return;
  }
  
  lockButton(registerBtnSubmit, "Creating Account...");
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      showMessage(registerMessage, "Account created successfully! Redirecting...", "success");
      
      localStorage.setItem('authToken', data.data.token);
      localStorage.setItem('userData', JSON.stringify(data.data.user));
      
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 2000);
      
    } else {
      showMessage(registerMessage, data.message || "Registration failed", "error");
    }
    
  } catch (error) {
    console.error('Registration error:', error);
    showMessage(registerMessage, "Network error. Please try again.", "error");
  } finally {
    setTimeout(() => unlockButton(registerBtnSubmit, "Sign Up"), 3000);
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const formData = {
    identifier: loginIdentifier.value.trim(),
    password: loginPassword.value
  };
  
  if (!formData.identifier || !formData.password) {
    showMessage(loginMessage, "Please fill in all fields", "error");
    return;
  }
  
  lockButton(loginBtnSubmit, "Signing In...");
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      showMessage(loginMessage, "Login successful! Redirecting...", "success");
      
      localStorage.setItem('authToken', data.data.token);
      localStorage.setItem('userData', JSON.stringify(data.data.user));
      
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 2000);
      
    } else {
      showMessage(loginMessage, data.message || "Login failed", "error");
    }
    
  } catch (error) {
    console.error('Login error:', error);
    showMessage(loginMessage, "Network error. Please try again.", "error");
  } finally {
    setTimeout(() => unlockButton(loginBtnSubmit, "Sign In"), 3000);
  }
});

function lockButton(button, text) {
  button.disabled = true;
  button.textContent = text;
  button.style.opacity = "0.6";
  button.style.cursor = "not-allowed";
}

function unlockButton(button, text) {
  button.disabled = false;
  button.textContent = text;
  button.style.opacity = "1";
  button.style.cursor = "pointer";
}

function showMessage(container, message, type) {
  container.textContent = message;
  container.style.display = "block";
  
  if (type === "success") {
    container.style.backgroundColor = "#d4edda";
    container.style.color = "#155724";
    container.style.border = "1px solid #c3e6cb";
  } else {
    container.style.backgroundColor = "#f8d7da";
    container.style.color = "#721c24";
    container.style.border = "1px solid #f5c6cb";
  }
  
  setTimeout(() => {
    container.style.display = "none";
  }, 5000);
}

regPassword.addEventListener("input", () => {
  const password = regPassword.value;
  const confirmPassword = regConfirmPassword.value;
  
  if (confirmPassword && password !== confirmPassword) {
    regConfirmPassword.style.borderColor = "#dc3545";
  } else {
    regConfirmPassword.style.borderColor = "";
  }
});

regConfirmPassword.addEventListener("input", () => {
  const password = regPassword.value;
  const confirmPassword = regConfirmPassword.value;
  
  if (password && password !== confirmPassword) {
    regConfirmPassword.style.borderColor = "#dc3545";
  } else {
    regConfirmPassword.style.borderColor = "";
  }
});

regUsername.addEventListener("blur", () => {
  const username = regUsername.value.trim();
  if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
    regUsername.style.borderColor = "#dc3545";
    showMessage(registerMessage, "Username can only contain letters, numbers, and underscores", "error");
  } else {
    regUsername.style.borderColor = "";
  }
});

regEmail.addEventListener("blur", () => {
  const email = regEmail.value.trim();
  if (email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    regEmail.style.borderColor = "#dc3545";
    showMessage(registerMessage, "Please enter a valid email address", "error");
  } else {
    regEmail.style.borderColor = "";
  }
});

document.addEventListener('DOMContentLoaded', checkAuthStatus);