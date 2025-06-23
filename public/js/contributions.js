// contributions.js

document.addEventListener('DOMContentLoaded', () => {
  const contributionsSection = document.getElementById('contributions');

  // Simulated user role for demo ('chair' or 'delegate')
  const userRole = 'chair'; // change for testing
  const delegates = [
    { country: 'France' },
    { country: 'Japan' },
    { country: 'Brazil' },
    { country: 'Canada' },
    { country: 'Kenya' },
  ];

  // Contributions data structure
  // keys: speeches, points, amendments, strikes
  const contributionsData = {};
  delegates.forEach(d => {
    contributionsData[d.country] = {
      speeches: 0,
      points: 0,
      amendments: 0,
      strikes: 0,
    };
  });

  // Cooldown flag for buttons to prevent rapid clicking
  let cooldownActive = false;

  // Create and append heading
  const heading = document.createElement('h2');
  heading.textContent = 'Contributions Section';
  contributionsSection.appendChild(heading);

  // Create table
  const table = document.createElement('table');
  table.className = 'contributions-table';

  // Table header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Country', 'Speeches', 'Points', 'Amendments', 'Strikes'].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Table body
  const tbody = document.createElement('tbody');

  delegates.forEach(delegate => {
    const tr = document.createElement('tr');
    tr.dataset.country = delegate.country;

    // Country cell
    const tdCountry = document.createElement('td');
    tdCountry.textContent = delegate.country;
    tr.appendChild(tdCountry);

    // Contributions cells with buttons and number display
    ['speeches', 'points', 'amendments', 'strikes'].forEach(key => {
      const td = document.createElement('td');
      td.className = 'contrib-cell';

      if (userRole === 'chair') {
        // Decrement button
        const decBtn = document.createElement('button');
        decBtn.textContent = '-';
        decBtn.className = 'contrib-btn';
        decBtn.title = `Decrease ${key}`;
        decBtn.addEventListener('click', () => {
          if (cooldownActive) return;
          if (contributionsData[delegate.country][key] > 0) {
            contributionsData[delegate.country][key]--;
            updateCell();
            triggerCooldown();
          }
        });
        td.appendChild(decBtn);
      }

      // Number display
      const numSpan = document.createElement('span');
      numSpan.className = 'contrib-number';
      numSpan.textContent = contributionsData[delegate.country][key];
      td.appendChild(numSpan);

      if (userRole === 'chair') {
        // Increment button
        const incBtn = document.createElement('button');
        incBtn.textContent = '+';
        incBtn.className = 'contrib-btn';
        incBtn.title = `Increase ${key}`;
        incBtn.addEventListener('click', () => {
          if (cooldownActive) return;
          contributionsData[delegate.country][key]++;
          updateCell();
          triggerCooldown();
        });
        td.appendChild(incBtn);
      }

      // Helper to update this cell's number text
      function updateCell() {
        numSpan.textContent = contributionsData[delegate.country][key];
        // Disable decrement if zero
        if (userRole === 'chair') {
          decBtn.disabled = contributionsData[delegate.country][key] === 0;
        }
      }

      updateCell();
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  contributionsSection.appendChild(table);

  // Awards container
  const awardsContainer = document.createElement('div');
  awardsContainer.className = 'awards-container';

  // Helper to create award box with label and dropdown
  function createAwardBox(labelText) {
    const box = document.createElement('div');
    box.className = 'award-box';

    const label = document.createElement('label');
    label.textContent = labelText;
    box.appendChild(label);

    const select = document.createElement('select');
    select.className = 'award-select';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = `Select Country`;
    select.appendChild(defaultOption);

    delegates.forEach(d => {
      const option = document.createElement('option');
      option.value = d.country;
      option.textContent = d.country;
      select.appendChild(option);
    });

    box.appendChild(select);
    return { box, select };
  }

  const bestDelegate = createAwardBox('Best Delegate');
  const honoraryMention = createAwardBox('Honorary Mention');
  const bestPositionPaper = createAwardBox('Best Position Paper');

  awardsContainer.appendChild(bestDelegate.box);
  awardsContainer.appendChild(honoraryMention.box);
  awardsContainer.appendChild(bestPositionPaper.box);

  contributionsSection.appendChild(awardsContainer);

  // Cooldown to prevent rapid clicks
  function triggerCooldown() {
    cooldownActive = true;
    setTimeout(() => {
      cooldownActive = false;
    }, 700); // 0.7 seconds cooldown
  }

  // Delegates should not see this entire section —  
  // You can add conditional rendering or redirect logic later based on userRole.
});
