'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import URLInput from '@/components/URLInput';
import AppShell from '@/components/AppShell';
import Logo from '@/components/Logo';
import ProgressIndicator, { PIPELINE_STEPS } from '@/components/ProgressIndicator';

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin");
    }
  }, [user, authLoading, router]);

  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    setErrorMessage(null);
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
        if (data.errorType === 'anti-bot') {
          setErrorMessage(
            `🛡️ This website has strict anti-bot protection measures, so we can't retrieve results for it. Try a different URL.`
          );
        } else {
          setErrorMessage(data.error || 'Analysis failed. Please try again.');
        }
        setIsLoading(false);
      }
    } catch (err) {
      clearInterval(stepInterval);
      console.error(err);
      setErrorMessage('Network error. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  // Don't render anything while checking auth or redirecting
  if (authLoading || !user) return null;

  return (
    <AppShell>
      <div className="landing">
        {/* Ambient gradient wash */}
        <div className="landing-glow" />

        <main className="landing-content">
          <div className="landing-badge">
            <Logo size={22} wordmark={false} />
            <span>SitePulse AI</span>
          </div>

          <h1 className="landing-title">
            Instant <span className="gradient-text">SEO &amp; AEO</span> intelligence
          </h1>

          <p className="landing-subtitle">
            Enter any URL and get prioritised, copy-ready recommendations to rank higher in
            search <em>and</em> get cited by AI engines.
          </p>

          <div className="url-input-container">
            <URLInput onSubmit={handleAnalyze} isLoading={isLoading} />

            {errorMessage && (
              <div className="error-banner" id="error-banner">
                <span className="error-banner-text">{errorMessage}</span>
                <button
                  className="error-banner-dismiss"
                  onClick={() => setErrorMessage(null)}
                  aria-label="Dismiss error"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {isLoading && (
            <ProgressIndicator
              currentStep={PIPELINE_STEPS[step]}
              totalSteps={PIPELINE_STEPS.length}
              completedSteps={step + 1}
            />
          )}
        </main>
      </div>
    </AppShell>
  );
}
