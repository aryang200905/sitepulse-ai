'use client';

import { useState } from 'react';

interface ExportControlsProps {
  analysisId: string;
  analysisJson: string;
}

export default function ExportControls({ analysisId, analysisJson }: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisJson }),
      });
      const data = await res.json();

      if (data.success && data.html) {
        // Create a downloadable file
        const blob = new Blob([data.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sitepulse-report-${analysisId.slice(0, 8)}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        alert(data.error || 'Export failed.');
      }
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="export-controls" id="export-controls">
      <button className="export-btn" onClick={handleExport} disabled={isExporting} id="export-btn">
        {isExporting ? (
          <span className="btn-loading">
            <span className="spinner-small" />
            Generating…
          </span>
        ) : (
          '📥 Download HTML Report'
        )}
      </button>
      <p className="export-note">
        Downloads a self-contained, styled HTML file you can open in any browser or send to clients.
      </p>
    </div>
  );
}
