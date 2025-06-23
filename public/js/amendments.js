// amendments.js

document.addEventListener('DOMContentLoaded', () => {
  const amendmentsSection = document.getElementById('amendments');

  // User role simulation: 'chair' or 'delegate'
  const userRole = 'delegate'; // Change to 'chair' or 'delegate' for testing
  const userCountry = 'France'; // Delegate's country (for demo)

  // Track amendment count
  let amendmentCount = 0;

  // Amendments storage (in-memory)
  const amendments = [];

  // Create and append heading
  const heading = document.createElement('h2');
  heading.textContent = 'Amendments Section';
  amendmentsSection.appendChild(heading);

  // Create form container
  const form = document.createElement('form');
  form.className = 'amendment-form';
  form.setAttribute('autocomplete', 'off');

  // Dropdown helpers
  function createLabel(text, forId) {
    const label = document.createElement('label');
    label.htmlFor = forId;
    label.textContent = text;
    return label;
  }

  function createSelect(id, options) {
    const select = document.createElement('select');
    select.id = id;
    select.name = id;
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      select.appendChild(option);
    });
    return select;
  }

  // Number dropdown (1-10)
  form.appendChild(createLabel('Number:', 'amend-num'));
  const numSelect = createSelect('amend-num', Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: (i + 1).toString() })));
  form.appendChild(numSelect);

  // Letter dropdown (A-H)
  form.appendChild(createLabel('Letter:', 'amend-letter'));
  const letterSelect = createSelect('amend-letter', [...'ABCDEFGH'].map(l => ({ value: l, label: l })));
  form.appendChild(letterSelect);

  // Roman numeral dropdown (I-VIII)
  form.appendChild(createLabel('Roman Numeral:', 'amend-roman'));
  const romanOptions = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].map(r => ({ value: r, label: r }));
  const romanSelect = createSelect('amend-roman', romanOptions);
  form.appendChild(romanSelect);

  // Friendly checkbox
  const friendlyLabel = document.createElement('label');
  friendlyLabel.htmlFor = 'amend-friendly';
  friendlyLabel.style.marginTop = '1rem';
  const friendlyCheckbox = document.createElement('input');
  friendlyCheckbox.type = 'checkbox';
  friendlyCheckbox.id = 'amend-friendly';
  friendlyCheckbox.name = 'amend-friendly';
  friendlyCheckbox.style.marginLeft = '0.5rem';
  friendlyLabel.appendChild(document.createTextNode('Friendly Amendment'));
  friendlyLabel.appendChild(friendlyCheckbox);
  form.appendChild(friendlyLabel);

  // Formatting buttons container
  const formattingButtons = document.createElement('div');
  formattingButtons.className = 'formatting-buttons';

  ['bold', 'italic', 'underline'].forEach(format => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = format.charAt(0).toUpperCase() + format.slice(1);
    btn.title = `Toggle ${format}`;
    btn.addEventListener('click', () => toggleFormatting(format));
    formattingButtons.appendChild(btn);
  });
  form.appendChild(formattingButtons);

  // Content textarea
  const contentBox = document.createElement('textarea');
  contentBox.className = 'amendment-content';
  contentBox.id = 'amend-content';
  contentBox.name = 'amend-content';
  contentBox.placeholder = 'Write your amendment here...';
  form.appendChild(contentBox);

  // Submit button
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'amendment-submit-btn';
  submitBtn.textContent = 'Submit Amendment';
  form.appendChild(submitBtn);

  amendmentsSection.appendChild(form);

  // Amendments list container
  const listContainer = document.createElement('div');
  listContainer.className = 'amendments-list';
  amendmentsSection.appendChild(listContainer);

  // Toggle formatting function
  function toggleFormatting(format) {
    const start = contentBox.selectionStart;
    const end = contentBox.selectionEnd;
    if (start === end) return; // no selection

    const selectedText = contentBox.value.substring(start, end);

    let formattedText;
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
    }

    contentBox.setRangeText(formattedText, start, end, 'end');
    contentBox.focus();
  }

  // Render amendments list
  function renderAmendments() {
    listContainer.innerHTML = '';

    amendments.forEach((amend, index) => {
      const banner = document.createElement('div');
      banner.className = 'amendment-banner';

      // Status class
      if (amend.status === 'approved') banner.classList.add('amendment-approved');
      else if (amend.status === 'declined') banner.classList.add('amendment-declined');

      // Header with amendment number and country
      const header = document.createElement('div');
      header.className = 'amendment-header';
      header.innerHTML = `<div>Amendment #${index + 1}: ${amend.number}${amend.letter}${amend.roman}</div><div class="amendment-country">${amend.country}</div>`;
      banner.appendChild(header);

      // Friendly label if checked
      if (amend.friendly) {
        const friendlyTag = document.createElement('div');
        friendlyTag.style.color = '#cba135';
        friendlyTag.style.fontWeight = 'bold';
        friendlyTag.style.marginBottom = '0.5rem';
        friendlyTag.textContent = 'Friendly Amendment';
        banner.appendChild(friendlyTag);
      }

      // Content (parse markdown-like simple styling)
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = parseSimpleMarkdown(amend.content);
      banner.appendChild(contentDiv);

      // Chair approve/decline buttons
      if (userRole === 'chair') {
        const actions = document.createElement('div');
        actions.className = 'amendment-actions';

        const approveBtn = document.createElement('button');
        approveBtn.className = 'approve-btn';
        approveBtn.textContent = 'Approve';
        approveBtn.addEventListener('click', () => {
          amend.status = 'approved';
          renderAmendments();
        });

        const declineBtn = document.createElement('button');
        declineBtn.className = 'decline-btn';
        declineBtn.textContent = 'Decline';
        declineBtn.addEventListener('click', () => {
          amend.status = 'declined';
          renderAmendments();
        });

        actions.appendChild(approveBtn);
        actions.appendChild(declineBtn);
        banner.appendChild(actions);
      }

      listContainer.appendChild(banner);
    });
  }

  // Simple markdown-like parser for **bold**, *italic*, __underline__
  function parseSimpleMarkdown(text) {
    let html = text
      .replace(/__([^_]+)__/g, '<u>$1</u>')
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/\*([^*]+)\*/g, '<i>$1</i>')
      .replace(/\n/g, '<br>');
    return html;
  }

  // Handle form submission
  form.addEventListener('submit', e => {
    e.preventDefault();

    // Validate content
    if (!contentBox.value.trim()) {
      alert('Amendment content cannot be empty.');
      return;
    }

    // Create amendment object
    const newAmendment = {
      number: numSelect.value,
      letter: letterSelect.value,
      roman: romanSelect.value,
      friendly: friendlyCheckbox.checked,
      content: contentBox.value.trim(),
      country: userCountry,
      status: null // pending by default
    };

    amendments.push(newAmendment);
    amendmentCount++;

    // Clear form
    contentBox.value = '';
    friendlyCheckbox.checked = false;
    numSelect.selectedIndex = 0;
    letterSelect.selectedIndex = 0;
    romanSelect.selectedIndex = 0;

    renderAmendments();

    // Optional animation or confirmation
    alert('Amendment submitted successfully!');
  });

  // Initial render (empty)
  renderAmendments();
});
