'use client';

interface LogoProps {
  size?: number;
  /** Show the "SitePulse AI" wordmark next to the mark. */
  wordmark?: boolean;
  className?: string;
}

/**
 * SitePulse mark: a gradient tile with a pulse/signal line that ticks upward —
 * "a live read on your site". Renders crisply in both themes.
 */
export default function Logo({ size = 36, wordmark = true, className }: LogoProps) {
  const id = 'sp-logo-grad';
  return (
    <span className={`sp-logo ${className ?? ''}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="sp-logo-mark"
      >
        <defs>
          <linearGradient id={id} x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f97316" />
            <stop offset="0.5" stopColor="#a855f7" />
            <stop offset="1" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="42" height="42" rx="13" fill={`url(#${id})`} />
        <path
          d="M9 27 H17 L21 17 L27 33 L31 24 H39"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="39" cy="24" r="2.6" fill="#fff" />
      </svg>
      {wordmark && (
        <span className="sp-logo-word">
          SitePulse<span className="sp-logo-ai"> AI</span>
        </span>
      )}
    </span>
  );
}
