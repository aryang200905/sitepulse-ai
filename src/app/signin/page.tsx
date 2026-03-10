'use client';

  import { useEffect, useState, type FormEvent } from 'react';
  import { useRouter } from 'next/navigation';
  import { useAuth } from '@/components/AuthProvider';

  export default function SignInPage() {
    const router = useRouter();
    const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // If already signed in, redirect to home
    useEffect(() => {
      if (!loading && user) {
        router.push('/');
      }
    }, [user, loading, router]);

    if (!loading && user) return null;

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      router.push('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed.';
      setError(message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithGoogle();
      router.push('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed.';
      setError(message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim());
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="signin-page">
      {/* Animated background */}
      <div className="bg-blob blob-1" />
      <div className="bg-blob blob-2" />
      <div className="bg-blob blob-3" />

      <div className="signin-card">
        <div className="signin-logo">◆ SitePulse AI</div>
        <h1>{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
        <p className="signin-subtitle">
          {isSignUp
            ? 'Sign up to start analyzing websites'
            : 'Sign in to access your SEO & AEO dashboard'}
        </p>

        {/* Google Sign-In */}
        <button className="google-btn" onClick={handleGoogleSignIn} id="google-signin-btn">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <div className="signin-divider">
          <span>or</span>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="signin-form" id="signin-form">
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && <div className="signin-error">{error}</div>}

          <button type="submit" className="signin-submit" disabled={isSubmitting} id="signin-submit-btn">
            {isSubmitting ? (
              <span className="btn-loading">
                <span className="spinner-small" />
                {isSignUp ? 'Creating Account…' : 'Signing In…'}
              </span>
            ) : (
              isSignUp ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        <p className="signin-toggle">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="toggle-btn" id="toggle-auth-mode">
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
