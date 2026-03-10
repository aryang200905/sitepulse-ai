'use client';

import { useState } from 'react';
import type { AEOModule } from '@/types/analysis';

interface AEOPackProps {
  modules: AEOModule[];
}

export default function AEOPack({ modules }: AEOPackProps) {
  return (
    <div className="aeo-pack">
      <h2>🤖 AEO Content Modules</h2>
      <p className="aeo-subtitle">
        Pre-built content blocks optimized for AI engine extraction. Copy any module to add to your page.
      </p>
      <div className="aeo-modules">
        {modules.map((mod) => (
          <AEOModuleCard key={mod.id} module={mod} />
        ))}
      </div>
    </div>
  );
}

function AEOModuleCard({ module }: { module: AEOModule }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(module.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="aeo-module-card" id={`aeo-module-${module.id}`}>
      <div className="aeo-module-header">
        <h3>{module.title}</h3>
        <button onClick={handleCopy} className="copy-btn" id={`copy-aeo-${module.id}`}>
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>
      <pre className="aeo-module-content">{module.content}</pre>
    </div>
  );
}
