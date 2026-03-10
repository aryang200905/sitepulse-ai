'use client';

interface ScoreCardProps {
  label: string;
  score: number;
  color?: string;
}

export default function ScoreCard({ label, score, color = '#f97316' }: ScoreCardProps) {
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';

  return (
    <div className="score-card" id={`score-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <svg width="140" height="140" viewBox="0 0 120 120">
        {/* Track */}
        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        {/* Progress */}
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
        {/* Score */}
        <text x="60" y="55" textAnchor="middle" fill={color} fontSize="28" fontWeight="800">
          {score}
        </text>
        <text x="60" y="75" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="12">
          {grade}
        </text>
      </svg>
      <span className="score-label">{label}</span>
    </div>
  );
}
