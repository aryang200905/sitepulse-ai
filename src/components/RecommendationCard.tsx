'use client';

import { useState } from 'react';
import type { Recommendation } from '@/types/analysis';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export default function RecommendationCard({ recommendation: rec }: RecommendationCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rec.copyReadyExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const priorityClass = rec.priority.toLowerCase().replace(/[^a-z]/g, '');

  return (
    <div className="rec-card" id={`rec-${rec.rank}`}>
      <div className="rec-header">
        <span className="rec-rank">#{rec.rank}</span>
        <span className={`rec-priority priority-${priorityClass}`}>{rec.priority}</span>
        <span className="rec-category">{rec.category.toUpperCase()}</span>
      </div>
      <h3 className="rec-title">{rec.title}</h3>
      <p className="rec-desc">{rec.description}</p>
      <p className="rec-fix"><strong>Fix:</strong> {rec.fix}</p>
      <div className="rec-example">
        <div className="example-header">
          <span>Copy-ready code</span>
          <button onClick={handleCopy} className="copy-btn" id={`copy-btn-${rec.rank}`}>
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>
        <pre><code>{rec.copyReadyExample}</code></pre>
      </div>
    </div>
  );
}
