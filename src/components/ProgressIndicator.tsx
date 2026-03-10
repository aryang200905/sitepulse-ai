'use client';

export const PIPELINE_STEPS = [
  'Fetching page…',
  'Parsing HTML…',
  'Running SEO audit…',
  'Running AEO audit…',
  'Classifying site…',
  'Generating recommendations…',
  'Building content modules…',
  'Finalizing report…',
] as const;

interface ProgressIndicatorProps {
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
}

export default function ProgressIndicator({ currentStep, totalSteps, completedSteps }: ProgressIndicatorProps) {
  const percent = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className="progress-indicator" id="progress-indicator">
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="progress-step">{currentStep}</p>
      <p className="progress-percent">{percent}%</p>
    </div>
  );
}
