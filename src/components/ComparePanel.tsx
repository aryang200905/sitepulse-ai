'use client';

import { useState, type FormEvent } from 'react';
import type { AnalysisResult, SEOIssue } from '@/types/analysis';

interface ComparePanelProps {
  base: AnalysisResult;
}

interface Diff {
  title: string;
  category: 'SEO' | 'AEO';
}

export default function ComparePanel({ base }: ComparePanelProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [competitor, setCompetitor] = useState<AnalysisResult | null>(null);

  const handleCompare = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setCompetitor(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (data.success && data.data) setCompetitor(data.data);
      else setError(data.error || 'Could not analyze that site.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const you = hostOf(base.url);
  const them = competitor ? hostOf(competitor.url) : 'Competitor';

  return (
    <div className="compare-panel">
      <div className="compare-intro">
        <h2>Compare against a competitor</h2>
        <p>Enter a similar site to benchmark your SEO &amp; AEO scores and see exactly where they’re ahead.</p>
      </div>

      <form className="compare-form" onSubmit={handleCompare}>
        <div className="input-wrapper">
          <span className="input-icon">🔗</span>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="competitor-website.com"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !url.trim()}>
            {loading ? <span className="btn-loading"><span className="spinner-small" />Analyzing…</span> : 'Compare'}
          </button>
        </div>
      </form>

      {error && <div className="compare-error">{error}</div>}

      {competitor && (
        <>
          <div className="compare-legend">
            <span className="legend-item"><span className="legend-dot legend-you" /> {you} <em>(you)</em></span>
            <span className="legend-item"><span className="legend-dot legend-them" /> {them}</span>
          </div>

          <div className="compare-bars">
            <ScoreBar label="SEO Score" you={base.seo.score} them={competitor.seo.score} />
            <ScoreBar label="AEO Score" you={base.aeo.score} them={competitor.aeo.score} />
          </div>

          <AdvantageGrid base={base} competitor={competitor} themName={them} />
        </>
      )}
    </div>
  );
}

function ScoreBar({ label, you, them }: { label: string; you: number; them: number }) {
  const delta = you - them;
  return (
    <div className="score-bar-group">
      <div className="score-bar-head">
        <span className="score-bar-label">{label}</span>
        <span className={`score-bar-delta ${delta >= 0 ? 'up' : 'down'}`}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} pts
        </span>
      </div>
      <div className="score-bar-row">
        <span className="score-bar-track"><span className="score-bar-fill you" style={{ width: `${you}%` }} /></span>
        <span className="score-bar-num">{you}</span>
      </div>
      <div className="score-bar-row">
        <span className="score-bar-track"><span className="score-bar-fill them" style={{ width: `${them}%` }} /></span>
        <span className="score-bar-num">{them}</span>
      </div>
    </div>
  );
}

function AdvantageGrid({
  base,
  competitor,
  themName,
}: {
  base: AnalysisResult;
  competitor: AnalysisResult;
  themName: string;
}) {
  const theyBeat = diffChecks(competitor, base); // competitor passes, you fail
  const youBeat = diffChecks(base, competitor); // you pass, competitor fails

  return (
    <div className="advantage-grid">
      <div className="advantage-col">
        <h3 className="advantage-title them-title">What {themName} does better ({theyBeat.length})</h3>
        {theyBeat.length ? (
          <ul className="advantage-list">
            {theyBeat.map((d, i) => (
              <li key={i}><span className={`tag tag-${d.category.toLowerCase()}`}>{d.category}</span> {d.title}</li>
            ))}
          </ul>
        ) : (
          <p className="advantage-empty">Nothing — you match or beat them on every check. 🎉</p>
        )}
      </div>

      <div className="advantage-col">
        <h3 className="advantage-title you-title">Where you’re ahead ({youBeat.length})</h3>
        {youBeat.length ? (
          <ul className="advantage-list">
            {youBeat.map((d, i) => (
              <li key={i}><span className={`tag tag-${d.category.toLowerCase()}`}>{d.category}</span> {d.title}</li>
            ))}
          </ul>
        ) : (
          <p className="advantage-empty">No clear edge yet — check the fixes tab to pull ahead.</p>
        )}
      </div>
    </div>
  );
}

/** Checks that `winner` passes but `loser` fails, across SEO + AEO. */
function diffChecks(winner: AnalysisResult, loser: AnalysisResult): Diff[] {
  const out: Diff[] = [];
  const scan = (w: SEOIssue[], l: SEOIssue[], category: 'SEO' | 'AEO') => {
    const loserMap = new Map(l.map((c) => [c.id, c.passed]));
    for (const c of w) {
      if (c.passed && loserMap.get(c.id) === false) out.push({ title: c.title, category });
    }
  };
  scan(winner.seo.checks, loser.seo.checks, 'SEO');
  scan(winner.aeo.checks, loser.aeo.checks, 'AEO');
  return out;
}

function hostOf(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return u;
  }
}
