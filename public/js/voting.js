// voting.js

document.addEventListener('DOMContentLoaded', () => {
  const votingSection = document.getElementById('voting');

  // Role simulation: "chair" or "delegate"
  const userRole = 'chair'; // change to 'chair' or 'delegate' for testing

  // Voting state
  let votingOpen = false;
  let votes = { yes: 0, no: 0, abstain: 0 };
  let userHasVoted = false;

  // Clear the voting section
  votingSection.innerHTML = '';

  // Title
  const title = document.createElement('h2');
  title.textContent = 'Voting Section';
  votingSection.appendChild(title);

  // Voting status display
  const status = document.createElement('div');
  status.className = 'voting-status';
  updateStatus();
  votingSection.appendChild(status);

  // Chair controls container
  let chairControls = null;
  if (userRole === 'chair') {
    chairControls = document.createElement('div');
    chairControls.style.marginBottom = '2rem';

    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Open Voting';
    toggleButton.className = 'vote-button';
    toggleButton.style.minWidth = '140px';

    toggleButton.addEventListener('click', () => {
      votingOpen = !votingOpen;

      // Reset votes and voting status when closing
      if (!votingOpen) {
        votes = { yes: 0, no: 0, abstain: 0 };
        userHasVoted = false;
      }

      toggleButton.textContent = votingOpen ? 'Close Voting' : 'Open Voting';
      updateStatus();
      updateResults();
      updateButtons();
    });

    chairControls.appendChild(toggleButton);
    votingSection.appendChild(chairControls);
  }

  // Container for vote buttons (delegates)
  const voteOptions = document.createElement('div');
  voteOptions.className = 'vote-options';

  ['Yes', 'No', 'Abstain'].forEach(option => {
    const btn = document.createElement('button');
    btn.className = 'vote-button';
    btn.textContent = option;
    btn.disabled = !votingOpen || userHasVoted || userRole !== 'delegate';
    btn.addEventListener('click', () => castVote(option.toLowerCase()));
    voteOptions.appendChild(btn);
  });

  votingSection.appendChild(voteOptions);

  // Vote results container (chairs only)
  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'vote-results';
  if (userRole === 'chair') {
    ['Yes', 'No', 'Abstain'].forEach(option => {
      const div = document.createElement('div');
      div.id = `vote-count-${option.toLowerCase()}`;
      div.textContent = `${option}: 0`;
      resultsContainer.appendChild(div);
    });
    votingSection.appendChild(resultsContainer);
  }

  // Error message for delegates when voting closed
  const errorMsg = document.createElement('div');
  errorMsg.className = 'voting-error';
  votingSection.appendChild(errorMsg);

  // Function to update the status text
  function updateStatus() {
    status.textContent = votingOpen ? 'Voting is OPEN' : 'Voting is CLOSED';
    errorMsg.textContent = (!votingOpen && userRole === 'delegate') ? 'Voting is currently closed. Redirecting to Dashboard...' : '';
  }

  // Update enable/disable state of vote buttons (delegates only)
  function updateButtons() {
    voteOptions.querySelectorAll('button').forEach(btn => {
      btn.disabled = !votingOpen || userHasVoted || userRole !== 'delegate';
    });
  }

  // Function to cast a vote
  function castVote(choice) {
    if (!votingOpen || userHasVoted) return;

    votes[choice] += 1;
    userHasVoted = true;
    updateStatus();
    updateResults();
    updateButtons();

    alert(`You voted: ${choice.charAt(0).toUpperCase() + choice.slice(1)}`);
  }

  // Function to update chair results live
  function updateResults() {
    if (userRole !== 'chair') return;
    Object.entries(votes).forEach(([key, val]) => {
      const div = document.getElementById(`vote-count-${key}`);
      if (div) div.textContent = `${key.charAt(0).toUpperCase() + key.slice(1)}: ${val}`;
    });
  }

  // For delegates, check every second if voting closed to redirect
  if (userRole === 'delegate') {
    setInterval(() => {
      if (!votingOpen) {
        errorMsg.textContent = 'Voting is currently closed. Redirecting to Dashboard...';
        setTimeout(() => {
          window.location.hash = '#dashboard';
        }, 3000);
      }
    }, 1000);
  }
});
