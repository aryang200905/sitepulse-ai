'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import type { AnalysisResult } from '@/types/analysis';
import ScoreCard from '@/components/ScoreCard';
import RecommendationCard from '@/components/RecommendationCard';
import AEOPack from '@/components/AEOPack';
import DraftPreview from '@/components/DraftPreview';
import ExportControls from '@/components/ExportControls';

type Tab = 'recommendations' | 'seo' | 'aeo' | 'draft' | 'export';

export default function ResultsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [tab, setTab] = useState<Tab>('recommendations');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
      return;
    }

    const stored = sessionStorage.getItem('sitepulse_result');
    if (stored) {
      setResult(JSON.parse(stored));
    } else if (!authLoading) {
      router.push('/');
    }
  }, [router, user, authLoading]);

  // Don't render anything while checking auth or redirecting
  if (authLoading || !user) return null;

  if (!result) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        Loading results…
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'recommendations', label: '🎯 Top 10 Fixes' },
    { key: 'seo',             label: '🔍 SEO Details' },
    { key: 'aeo',             label: '🤖 AEO Pack' },
    { key: 'draft',           label: '📝 Draft / Blueprint' },
    { key: 'export',          label: '📥 Export' },
  ];

  return (
    <div className="results-page">
      {/* Header */}
      <header className="results-header">
        <button className="back-btn" onClick={() => router.push('/')} id="back-btn">
          ← New Analysis
        </button>
        <h1>
          Results for <span className="url-highlight">{result.url}</span>
        </h1>
        <span className="complexity-badge">{result.complexity}</span>
      </header>

      {/* Scores */}
      <section className="scores-row">
        <ScoreCard label="SEO Score" score={result.seo.score} />
        <ScoreCard label="AEO Score" score={result.aeo.score} color="#a78bfa" />
      </section>

      {/* Tabs */}
      <nav className="results-tabs" id="results-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? 'tab active' : 'tab'}
            onClick={() => setTab(t.key)}
            id={`tab-${t.key}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <section className="tab-content">
        {tab === 'recommendations' && (
          <div className="rec-list">
            {result.recommendations.map((rec) => (
              <RecommendationCard key={rec.rank} recommendation={rec} />
            ))}
          </div>
        )}

        {tab === 'seo' && (
          <div className="seo-details">
            <h2>SEO Issues ({result.seo.issues.length})</h2>
            {result.seo.issues.map((issue) => (
              <div key={issue.id} className="seo-issue-card">
                <h3>{issue.title}</h3>
                <p>{issue.description}</p>
                <p className="issue-fix">
                  <strong>Fix:</strong> {issue.fix}
                </p>
                <code className="issue-example">{issue.copyReadyExample}</code>
              </div>
            ))}
          </div>
        )}

        {tab === 'aeo' && <AEOPack modules={result.aeo.modules} />}

        {tab === 'draft' && (
          <div>
            {result.draft && <DraftPreview draft={result.draft} />}
            {result.blueprint && (
              <div className="blueprint-section">
                <h2>Blueprint</h2>
                <DraftPreview draft={result.blueprint.samplePage} />
                <h3>Rollout Plan</h3>
                <pre className="rollout-plan">{result.blueprint.rolloutPlan}</pre>
              </div>
            )}
            {!result.draft && !result.blueprint && <p>No draft or blueprint available.</p>}
          </div>
        )}

        {tab === 'export' && (
          <div className="export-section">
            <h2>Export Report</h2>
            <p>Download a styled HTML report of this analysis.</p>
            <ExportControls analysisId={result.id} analysisJson={JSON.stringify(result)} />
          </div>
        )}
      </section>
    </div>
  );
}
