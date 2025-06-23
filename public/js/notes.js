// notes.js

document.addEventListener('DOMContentLoaded', () => {
  const notesSection = document.getElementById('notes');

  // Dummy users list (excluding self)
  const users = [
    { id: 1, country: "France" },
    { id: 2, country: "India" },
    { id: 3, country: "South Korea" },
    { id: 4, country: "Canada" },
    { id: 5, country: "UAE" }
  ];

  // Current user id (for demo, hardcoded)
  const currentUserId = 1;

  // Filter out self from recipient options
  const recipients = users.filter(u => u.id !== currentUserId);

  // Create recipient dropdown
  const select = document.createElement('select');
  select.className = 'conversation-select';
  recipients.forEach(user => {
    const option = document.createElement('option');
    option.value = user.id;
    option.textContent = user.country;
    select.appendChild(option);
  });
  notesSection.appendChild(select);

  // Chat window container
  const chatWindow = document.createElement('div');
  chatWindow.className = 'chat-window';
  notesSection.appendChild(chatWindow);

  // Input area
  const inputArea = document.createElement('div');
  inputArea.className = 'chat-input-area';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Type your message...';
  inputArea.appendChild(input);

  const sendBtn = document.createElement('button');
  sendBtn.textContent = 'Send';
  inputArea.appendChild(sendBtn);

  notesSection.appendChild(inputArea);

  // In-memory message store: { recipientId: [{from, to, text, approved, id}] }
  const messages = {};

  // Helper to render chat messages for selected recipient
  function renderMessages(recipientId) {
    chatWindow.innerHTML = '';
    if (!messages[recipientId]) return;

    messages[recipientId].forEach(msg => {
      const msgDiv = document.createElement('div');
      msgDiv.classList.add('message');
      msgDiv.textContent = msg.text;

      // Style messages based on sender & approval
      if (msg.from === currentUserId) {
        msgDiv.classList.add('sent');
        // Approved messages have green border, else default
        if (msg.approved === true) {
          msgDiv.style.border = '2px solid #2ecc40'; // green border
        }
        else if (msg.approved === false) {
          msgDiv.style.border = '2px solid #e74c3c'; // red border
          msgDiv.title = `Message rejected: ${msg.rejectReason || 'No reason provided'}`;
        }
      } else {
        msgDiv.classList.add('received');
      }

      chatWindow.appendChild(msgDiv);
    });

    // Scroll to bottom
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // Initially load first recipient chat
  if (recipients.length > 0) {
    select.value = recipients[0].id;
    renderMessages(recipients[0].id);
  }

  // Change conversation on recipient change
  select.addEventListener('change', () => {
    renderMessages(select.value);
  });

  // Send message handler
  sendBtn.addEventListener('click', () => {
    const text = input.value.trim();
    if (!text) return;

    const toId = select.value;

    // Initialize array if needed
    if (!messages[toId]) messages[toId] = [];

    // Add message with approved: null (pending moderation)
    messages[toId].push({
      id: Date.now(),
      from: currentUserId,
      to: parseInt(toId),
      text,
      approved: null,
      rejectReason: null,
    });

    input.value = '';
    renderMessages(toId);

    // Simulate moderator approval after a delay (for demo)
    setTimeout(() => {
      // Random approval or rejection for demo
      const approved = Math.random() > 0.3;
      messages[toId][messages[toId].length - 1].approved = approved;
      if (!approved) {
        messages[toId][messages[toId].length - 1].rejectReason = "Inappropriate content";
      }
      renderMessages(toId);
    }, 2000);
  });
});
