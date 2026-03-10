'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AnalysisResult } from '@/types/analysis';
import ExportControls from '@/components/ExportControls';

export default function ExportPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('sitepulse_result');
    if (stored) {
      setResult(JSON.parse(stored));
    } else {
      router.push('/');
    }
  }, [router]);

  if (!result) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        Loading…
      </div>
    );
  }

  return (
    <div className="export-page">
      <header className="results-header">
        <button className="back-btn" onClick={() => router.push('/results')} id="back-to-results">
          ← Back to Results
        </button>
        <h1>Export Report</h1>
      </header>

      <section className="export-main">
        <div className="export-card">
          <h2>📥 Download Full Report</h2>
          <p>
            Get a standalone HTML report for <strong>{result.url}</strong> with all scores,
            recommendations, and AEO content modules.
          </p>
          <ExportControls analysisId={result.id} analysisJson={JSON.stringify(result)} />
        </div>

        <div className="export-summary">
          <h3>Report Contents</h3>
          <ul>
            <li>SEO Score: <strong>{result.seo.score}/100</strong></li>
            <li>AEO Score: <strong>{result.aeo.score}/100</strong></li>
            <li>Complexity: <strong>{result.complexity}</strong></li>
            <li>{result.recommendations.length} prioritised recommendations</li>
            <li>{result.aeo.modules.length} AEO content modules</li>
            {result.draft && <li>Optimised page draft</li>}
            {result.blueprint && <li>Blueprint with rollout plan</li>}
          </ul>
        </div>
      </section>
    </div>
  );
}
