// World-Wide Message Handler
let socket = null;
let popupTimeout = null;

// Initialize socket connection
function initializeWorldWideMessage() {
  // Connect to Socket.IO server
  socket = io();
  
  // Listen for world-wide messages from God
  socket.on('worldWideMessage', (data) => {
    showWorldWideMessage(data.message);
  });
  
  // Handle connection events
  socket.on('connect', () => {
    console.log('Connected to server for world-wide messages');
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });
}

// Show world-wide message popup
function showWorldWideMessage(message) {
  const popup = document.getElementById('worldWideMessagePopup');
  const messageText = document.getElementById('worldWideMessageText');
  
  if (!popup || !messageText) {
    console.error('World-wide message popup elements not found');
    return;
  }
  
  // Set the message content
  messageText.textContent = message;
  
  // Clear any existing timeout
  if (popupTimeout) {
    clearTimeout(popupTimeout);
  }
  
  // Add entrance animation class
  popup.classList.add('entering');
  popup.classList.add('show');
  
  // Remove entrance class after animation completes
  setTimeout(() => {
    popup.classList.remove('entering');
  }, 800);
  
  // Auto-hide after 10 seconds
  popupTimeout = setTimeout(() => {
    closeWorldWidePopup();
  }, 10000);
  
  // Add some divine sound effect (optional)
  playDivineSound();
}

// Close world-wide message popup
function closeWorldWidePopup() {
  const popup = document.getElementById('worldWideMessagePopup');
  
  if (!popup) return;
  
  // Clear timeout if it exists
  if (popupTimeout) {
    clearTimeout(popupTimeout);
    popupTimeout = null;
  }
  
  // Add exit animation
  popup.classList.add('exiting');
  popup.classList.remove('show');
  
  // Remove popup after animation completes
  setTimeout(() => {
    popup.classList.remove('exiting');
  }, 500);
}

// Play divine sound effect (optional)
function playDivineSound() {
  // You can add a subtle chime sound here
  // For now, we'll just add a visual effect
  const popup = document.getElementById('worldWideMessagePopup');
  if (popup) {
    // Add a brief flash effect
    popup.style.filter = 'brightness(1.2)';
    setTimeout(() => {
      popup.style.filter = 'brightness(1)';
    }, 200);
  }
}

// Add keyboard shortcut to close popup (ESC key)
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeWorldWidePopup();
  }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on a page that should receive world-wide messages
  const shouldInitialize = document.getElementById('worldWideMessagePopup');
  
  if (shouldInitialize) {
    initializeWorldWideMessage();
  }
});

// Handle page visibility changes (pause timer when page is hidden)
document.addEventListener('visibilitychange', () => {
  const popup = document.getElementById('worldWideMessagePopup');
  
  if (document.hidden && popup && popup.classList.contains('show')) {
    // Page is hidden, pause the auto-close timer
    if (popupTimeout) {
      clearTimeout(popupTimeout);
      popupTimeout = null;
    }
  } else if (!document.hidden && popup && popup.classList.contains('show') && !popupTimeout) {
    // Page is visible again, restart the timer
    popupTimeout = setTimeout(() => {
      closeWorldWidePopup();
    }, 5000); // Give 5 more seconds when page becomes visible
  }
});

// Export functions for global access
window.showWorldWideMessage = showWorldWideMessage;
window.closeWorldWidePopup = closeWorldWidePopup; 