// people.js

document.addEventListener('DOMContentLoaded', () => {
  const peopleSection = document.getElementById('people');

  // Dummy user data (replace with real data from backend later)
  const users = [
    { name: "Elena Cruz", role: "Delegate", country: "France" },
    { name: "Rohan Patel", role: "Chair", country: "India" },
    { name: "Maya Lee", role: "Delegate", country: "South Korea" },
    { name: "Liam Smith", role: "Observer", country: "Canada" },
    { name: "Sara Al Maktoum", role: "Delegate", country: "UAE" }
  ];

  // Table container
  const table = document.createElement('table');
  table.className = 'people-table';

  // Table header
  table.innerHTML = `
    <thead>
      <tr>
        <th>Country</th>
        <th>Name</th>
        <th>Role</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  // Table body population
  const tbody = table.querySelector('tbody');
  users.forEach(user => {
    const row = document.createElement('tr');

    const countryCell = document.createElement('td');
    const flagImg = document.createElement('img');
    flagImg.src = `images/flags/${user.country.toLowerCase().replace(/\s+/g, '-')}.png`;
    flagImg.alt = `${user.country} Flag`;
    flagImg.className = 'country-flag';

    countryCell.appendChild(flagImg);
    countryCell.appendChild(document.createTextNode(user.country));

    row.appendChild(countryCell);

    const nameCell = document.createElement('td');
    nameCell.textContent = user.name;
    row.appendChild(nameCell);

    const roleCell = document.createElement('td');
    roleCell.textContent = user.role;
    row.appendChild(roleCell);

    tbody.appendChild(row);
  });

  // Append table to the section
  peopleSection.appendChild(table);
});
