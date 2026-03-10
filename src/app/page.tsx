'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import URLInput from '@/components/URLInput';
import ProgressIndicator, { PIPELINE_STEPS } from '@/components/ProgressIndicator';

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    setStep(0);

    // Simulate progressive step updates
    const stepInterval = setInterval(() => {
      setStep((prev) => {
        if (prev < PIPELINE_STEPS.length - 1) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 800);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      clearInterval(stepInterval);

      if (data.success && data.data) {
        sessionStorage.setItem('sitepulse_result', JSON.stringify(data.data));
        router.push('/results');
      } else {
        alert(data.error || 'Analysis failed. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      clearInterval(stepInterval);
      console.error(err);
      alert('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  // Don't render anything while checking auth or redirecting
  if (authLoading || !user) return null;

  return (
    <div className="landing-page">
      {/* Animated background blobs */}
      <div className="bg-blob blob-1" />
      <div className="bg-blob blob-2" />
      <div className="bg-blob blob-3" />

      <main className="landing-content">
        <div className="logo-mark">◆ SitePulse AI</div>
        <h1>
          Instant SEO &amp; AEO
          <br />
          <span className="gradient-text">Intelligence</span>
        </h1>
        <p className="landing-subtitle">
          Enter any URL and get prioritised, copy-ready recommendations
          to rank higher in search <em>and</em> get cited by AI engines.
        </p>

        <div className="url-input-container">
          <URLInput onSubmit={handleAnalyze} isLoading={isLoading} />
          
          <p className="disclaimer-text">
            <strong>Note:</strong> Works best on standard websites. Enterprise sites with strict anti-bot 
            protection (like Cloudflare) may block the analysis.
          </p>
        </div>

        {isLoading && (
          <ProgressIndicator
            currentStep={PIPELINE_STEPS[step]}
            totalSteps={PIPELINE_STEPS.length}
            completedSteps={step + 1}
          />
        )}

        <div className="feature-pills">
          <span className="pill">🔍 SEO Audit</span>
          <span className="pill">🤖 AEO Pack</span>
          <span className="pill">📋 Top 10 Fixes</span>
          <span className="pill">📥 Export</span>
        </div>
      </main>
    </div>
  );
}
