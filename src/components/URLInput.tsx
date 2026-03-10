'use client';

import { useState, type FormEvent } from 'react';

interface URLInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export default function URLInput({ onSubmit, isLoading }: URLInputProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (url.trim()) onSubmit(url.trim());
  };

  return (
    <form className="url-input-form" onSubmit={handleSubmit} id="url-input-form">
      <div className="input-wrapper">
        <span className="input-icon">🔗</span>
        <input
          id="url-input"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter any website URL…"
          disabled={isLoading}
          autoFocus
        />
        <button type="submit" disabled={isLoading || !url.trim()} id="analyze-btn">
          {isLoading ? (
            <span className="btn-loading">
              <span className="spinner-small" />
              Analyzing…
            </span>
          ) : (
            'Analyze'
          )}
        </button>
      </div>
    </form>
  );
}
