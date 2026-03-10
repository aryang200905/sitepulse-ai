/* ── SitePulse AI — Recommendations Engine ── */

import type { Recommendation, SEOResult, AEOResult } from '@/types/analysis';

/**
 * Generate a ranked Top 10 list of recommendations from SEO and AEO audit results.
 * Merges, deduplicates, and prioritises based on severity/impact.
 */
export function generateRecommendations(seo: SEOResult, aeo: AEOResult): Recommendation[] {
  const recs: Recommendation[] = [];

  // Convert SEO issues to recommendations
  for (const issue of seo.issues) {
    recs.push({
      rank: 0,
      title: issue.title,
      description: issue.description,
      priority: severityToPriority(issue.severity),
      category: 'seo',
      fix: issue.fix,
      copyReadyExample: issue.copyReadyExample,
    });
  }

  // Add AEO-specific recommendations if score is low
  if (aeo.score < 70) {
    recs.push({
      rank: 0,
      title: 'Add FAQ Schema Markup',
      description: 'FAQ schema helps AI engines extract Q&A pairs from your page.',
      priority: 'High-Impact',
      category: 'aeo',
      fix: 'Add FAQPage JSON-LD schema to your page with relevant questions and answers.',
      copyReadyExample: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Your question here?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Your answer here."
    }
  }]
}
</script>`,
    });
  }

  if (aeo.score < 50) {
    recs.push({
      rank: 0,
      title: 'Add HowTo Schema Markup',
      description: 'HowTo schema enables AI engines to extract step-by-step instructions.',
      priority: 'High-Impact',
      category: 'aeo',
      fix: 'Add HowTo JSON-LD schema with clear, numbered steps.',
      copyReadyExample: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to do X",
  "step": [{
    "@type": "HowToStep",
    "name": "Step 1",
    "text": "Detailed instruction for step 1."
  }]
}
</script>`,
    });

    recs.push({
      rank: 0,
      title: 'Create Quotable Definition Blocks',
      description: 'AI engines prioritize concise, quotable definitions in the first 200 words.',
      priority: 'Quick-Win',
      category: 'aeo',
      fix: 'Add a clear 2-3 sentence definition of your topic near the top of the page.',
      copyReadyExample: `<p><strong>[Your Topic]</strong> is [concise definition]. It provides [key benefit] for [target audience].</p>`,
    });
  }

  // Sort by priority and assign ranks
  const priorityOrder: Record<string, number> = {
    'Quick-Win': 1,
    'High-Impact': 2,
    'Medium': 3,
    'Low-Priority': 4,
  };

  recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recs.slice(0, 10).map((rec, i) => ({ ...rec, rank: i + 1 }));
}

function severityToPriority(severity: string): Recommendation['priority'] {
  switch (severity) {
    case 'critical': return 'Quick-Win';
    case 'warning': return 'High-Impact';
    default: return 'Medium';
  }
}
