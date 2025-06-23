// database.js

document.addEventListener('DOMContentLoaded', () => {
  const dataTextarea = document.getElementById('database-textarea');
  const downloadBtn = document.getElementById('download-pdf-btn');

  // Simulated conference data object (should be fetched from backend)
  const conferenceData = {
    voting: {
      open: false,
      results: {
        yes: 10,
        no: 5,
        abstain: 2,
      },
      history: [
        { date: '2025-06-23', result: { yes: 12, no: 3, abstain: 1 } },
      ],
    },
    chats: [
      { from: 'France', to: 'Japan', approved: true, message: 'Please prepare your speech.' },
      { from: 'Japan', to: 'France', approved: false, message: 'I disagree with your point.' },
    ],
    amendments: [
      { number: 1, country: 'Brazil', content: 'Increase environmental funding.', status: 'approved' },
      { number: 2, country: 'Kenya', content: 'Add clause for renewable energy.', status: 'pending' },
    ],
    contributions: {
      France: { speeches: 3, points: 2, amendments: 1, strikes: 0 },
      Japan: { speeches: 1, points: 0, amendments: 0, strikes: 1 },
    },
  };

  // Convert conference data to formatted JSON string for display
  function formatDataForDisplay(data) {
    return JSON.stringify(data, null, 2);
  }

  // Load data into textarea
  function loadData() {
    dataTextarea.value = formatDataForDisplay(conferenceData);
  }

  // Generate PDF and trigger download
  function downloadPDF() {
    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const maxLineWidth = pageWidth - margin * 2;
    const fontSize = 10;
    doc.setFont('Courier', 'normal');
    doc.setFontSize(fontSize);

    const text = dataTextarea.value;
    const lines = doc.splitTextToSize(text, maxLineWidth);

    let y = margin;
    lines.forEach(line => {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += fontSize * 1.2;
    });

    doc.save('conference_data.pdf');
  }

  // Initial load
  loadData();

  // Event listener for download button
  downloadBtn.addEventListener('click', downloadPDF);
});
