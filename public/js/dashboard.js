// dashboard.js

document.addEventListener('DOMContentLoaded', () => {
  const dashboard = document.getElementById('dashboard');

  // Dummy data (to be replaced with real data later)
  const userCountry = "France";
  const conferenceCode = "MUNX23-GOLD";
  const documents = [
    "Opening Ceremony Agenda",
    "Code of Conduct",
    "Rules of Procedure",
    "Delegate Handbook"
  ];

  // Welcome box
  const welcomeBox = document.createElement('div');
  welcomeBox.className = 'dashboard-welcome';
  welcomeBox.innerHTML = `
    <h1>Welcome Delegate of ${userCountry}</h1>
    <p>We’re thrilled to have you at the conference. Please review the documents below and reach out via the Notes section for any questions.</p>
    <div class="conference-code-box">Conference Code: ${conferenceCode}</div>
  `;
  dashboard.appendChild(welcomeBox);

  // Documents section
  const docsSection = document.createElement('div');
  docsSection.className = 'attached-docs';
  docsSection.innerHTML = `<h2>Attached Documents</h2>`;

  const docList = document.createElement('ul');
  documents.forEach(doc => {
    const li = document.createElement('li');
    li.textContent = doc;
    docList.appendChild(li);
  });

  docsSection.appendChild(docList);
  dashboard.appendChild(docsSection);
});
