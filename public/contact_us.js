// Contact form JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Contact page loaded successfully');
    
    // Check authentication status
    checkAuthStatus();
    
    // Setup contact form
    setupContactForm();
});

// Utility function for API calls with automatic token refresh
async function apiCall(url, options = {}) {
    const token = localStorage.getItem('authToken');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(url, finalOptions);
        
        // Check for new token in response headers
        const newToken = response.headers.get('X-New-Token');
        if (newToken) {
            console.log('Token refreshed via header');
            localStorage.setItem('authToken', newToken);
        }
        
        const data = await response.json();
        
        // Check for new token in response body
        if (data.token) {
            console.log('Token refreshed via response body');
            localStorage.setItem('authToken', data.token);
        }
        
        return { response, data };
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Check authentication status
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    if (token) {
        apiCall('/api/auth/check')
        .then(({ response, data }) => {
            if (response.ok && data.success && data.authenticated) {
                console.log('User authenticated on contact page');
            }
        })
        .catch(error => {
            console.error('Auth check error:', error);
        });
    }
}

// Setup contact form functionality
function setupContactForm() {
    const container = document.getElementById("container");
    const registerBtn = document.getElementById("register"); // Button for Contact Info panel
    const loginBtn = document.getElementById("login");       // Button for Contact Form panel

    // Contact form elements
    const contactForm = document.getElementById("contactForm");
    const emailInput = document.getElementById("email");
    const messageInput = document.getElementById("message");
    const submitBtn = document.getElementById("submitBtn");
    const messageContainer = document.getElementById("messageContainer");

    // Toggle functionality (preserving existing animations)
    registerBtn.addEventListener("click", () => {
        // Show Contact Info panel (sign-up) by adding 'active' class
        container.classList.add("active");
    });

    loginBtn.addEventListener("click", () => {
        // Show Contact Form panel (sign-in) by removing 'active' class
        container.classList.remove("active");
    });

    // Contact form submission
    contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // Get form data
        const email = emailInput.value.trim();
        const message = messageInput.value.trim();
        
        // Client-side validation
        if (!email || !message) {
            showMessage("Please fill in all fields", "error");
            return;
        }
        
        if (message.length < 10) {
            showMessage("Message must be at least 10 characters long", "error");
            return;
        }
        
        if (message.length > 1000) {
            showMessage("Message cannot exceed 1000 characters", "error");
            return;
        }
        
        // Lock submit button
        lockSubmitButton();
        
        try {
            // Send to backend using API call utility
            const { response, data } = await apiCall('/api/contact', {
                method: 'POST',
                body: JSON.stringify({
                    email: email,
                    message: message
                })
            });
            
            if (response.ok && data.success) {
                showMessage(`Message sent successfully! Token: #${data.data.token}`, "success");
                contactForm.reset();
            } else {
                showMessage(data.message || "Failed to send message. Please try again.", "error");
            }
            
        } catch (error) {
            console.error('Contact form error:', error);
            showMessage("Network error. Please check your connection and try again.", "error");
        } finally {
            // Unlock submit button after 3 seconds
            setTimeout(unlockSubmitButton, 3000);
        }
    });

    // Helper functions
    function lockSubmitButton() {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";
        submitBtn.style.opacity = "0.6";
        submitBtn.style.cursor = "not-allowed";
    }

    function unlockSubmitButton() {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send Message";
        submitBtn.style.opacity = "1";
        submitBtn.style.cursor = "pointer";
    }

    function showMessage(message, type) {
        messageContainer.textContent = message;
        messageContainer.style.display = "block";
        
        // Set styling based on message type
        if (type === "success") {
            messageContainer.style.backgroundColor = "#d4edda";
            messageContainer.style.color = "#155724";
            messageContainer.style.border = "1px solid #c3e6cb";
        } else {
            messageContainer.style.backgroundColor = "#f8d7da";
            messageContainer.style.color = "#721c24";
            messageContainer.style.border = "1px solid #f5c6cb";
        }
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageContainer.style.display = "none";
        }, 5000);
    }

    // Real-time validation
    emailInput.addEventListener("blur", () => {
        const email = emailInput.value.trim();
        if (email && !isValidEmail(email)) {
            emailInput.style.borderColor = "#dc3545";
            showMessage("Please enter a valid email address", "error");
        } else {
            emailInput.style.borderColor = "";
        }
    });

    messageInput.addEventListener("input", () => {
        const message = messageInput.value.trim();
        const charCount = message.length;
        
        if (charCount > 1000) {
            messageInput.value = message.substring(0, 1000);
            showMessage("Message cannot exceed 1000 characters", "error");
        }
    });

    function isValidEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }
}