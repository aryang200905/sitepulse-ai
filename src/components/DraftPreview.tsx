'use client';

import { useState } from 'react';
import type { DraftContent } from '@/types/analysis';

interface DraftPreviewProps {
  draft: DraftContent;
}

type ViewMode = 'preview' | 'markdown' | 'html';

export default function DraftPreview({ draft }: DraftPreviewProps) {
  const [mode, setMode] = useState<ViewMode>('preview');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const content = mode === 'markdown' ? draft.markdown : draft.html;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const views: { key: ViewMode; label: string }[] = [
    { key: 'preview', label: '👁 Preview' },
    { key: 'markdown', label: '📝 Markdown' },
    { key: 'html', label: '💻 HTML' },
  ];

  return (
    <div className="draft-preview" id="draft-preview">
      <div className="draft-controls">
        <div className="draft-tabs">
          {views.map((v) => (
            <button
              key={v.key}
              className={mode === v.key ? 'draft-tab active' : 'draft-tab'}
              onClick={() => setMode(v.key)}
              id={`draft-tab-${v.key}`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <button onClick={handleCopy} className="copy-btn" id="draft-copy-btn">
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>

      <div className="draft-content">
        {mode === 'preview' && (
          <div className="draft-rendered" dangerouslySetInnerHTML={{ __html: draft.preview }} />
        )}
        {mode === 'markdown' && <pre className="draft-code">{draft.markdown}</pre>}
        {mode === 'html' && <pre className="draft-code">{draft.html}</pre>}
      </div>
    </div>
  );
}
