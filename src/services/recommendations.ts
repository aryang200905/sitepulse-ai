/* ── SitePulse AI — Recommendations Engine ── */

import type { Recommendation, SEOResult, AEOResult } from '@/types/analysis';
import type { PageMeta } from '@/config/scoring';

/**
 * Build a ranked, de-duplicated list of the highest-impact fixes by merging the
 * failing SEO and AEO checks. Impact = the score points recovered by fixing it,
 * so the ranking is driven by real measured weight, not guesswork.
 */
export function generateRecommendations(seo: SEOResult, aeo: AEOResult, meta: PageMeta): Recommendation[] {
  const recs: Recommendation[] = [];

  // SEO issues already carry a real fix + copy-ready example.
  for (const issue of seo.issues) {
    recs.push({
      rank: 0,
      title: issue.title,
      description: issue.description,
      priority: priorityFor(issue.weight),
      category: 'seo',
      fix: issue.fix,
      copyReadyExample: issue.copyReadyExample,
      impact: issue.weight,
    });
  }

  // AEO failing checks — attach concrete fixes + examples here.
  for (const check of aeo.checks.filter((c) => !c.passed)) {
    const detail = aeoFix(check.id, meta);
    recs.push({
      rank: 0,
      title: check.title,
      description: check.description,
      priority: priorityFor(check.weight),
      category: 'aeo',
      fix: detail.fix,
      copyReadyExample: detail.example,
      impact: check.weight,
    });
  }

  // Rank by impact, then critical-first; keep the top 10.
  recs.sort((a, b) => b.impact - a.impact);
  return dedupe(recs)
    .slice(0, 10)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

function priorityFor(weight: number): Recommendation['priority'] {
  if (weight >= 10) return 'High-Impact';
  if (weight >= 7) return 'Quick-Win';
  if (weight >= 4) return 'Medium';
  return 'Low-Priority';
}

function dedupe(recs: Recommendation[]): Recommendation[] {
  const seen = new Set<string>();
  const out: Recommendation[] = [];
  for (const r of recs) {
    const key = r.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

function aeoFix(id: string, meta: PageMeta): { fix: string; example: string } {
  const topic = meta.h1Text || meta.title || 'your topic';
  const map: Record<string, { fix: string; example: string }> = {
    'faq-schema': {
      fix: 'Add an FAQ section wrapped in FAQPage JSON-LD so AI engines can lift Q&A pairs directly.',
      example: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is ${topic}?",
    "acceptedAnswer": { "@type": "Answer", "text": "A concise, grounded answer." }
  }]
}
</script>`,
    },
    'answer-first': {
      fix: 'Open the page with a 2–3 sentence direct answer to the query it targets, before any marketing copy.',
      example: `<p><strong>${topic}</strong> is [what it is]. It helps [who] achieve [outcome] by [how].</p>`,
    },
    'question-headings': {
      fix: 'Rewrite section headings as the actual questions users ask — AI engines match headings to prompts.',
      example: `<h2>How does ${topic} work?</h2>\n<h2>How much does ${topic} cost?</h2>`,
    },
    'content-depth': {
      fix: `Expand the page toward 600+ words of genuinely useful detail (currently ${meta.wordCount}).`,
      example: `<!-- Add sections: overview, how it works, comparisons, and a real FAQ. -->`,
    },
    'howto-schema': {
      fix: 'If the page explains a process, mark the steps up with HowTo JSON-LD.',
      example: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to use ${topic}",
  "step": [{ "@type": "HowToStep", "position": 1, "text": "First step." }]
}
</script>`,
    },
    'lists-steps': {
      fix: 'Break key information into bulleted or numbered lists — the easiest content for AI to quote verbatim.',
      example: `<ul>\n  <li>Key point one</li>\n  <li>Key point two</li>\n  <li>Key point three</li>\n</ul>`,
    },
    'entity-schema': {
      fix: 'Add Article/Organization/BreadcrumbList JSON-LD so AI engines can attribute and trust the content.',
      example: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "${topic}",
  "author": { "@type": "Organization", "name": "Your Brand" }
}
</script>`,
    },
    'concise-sentences': {
      fix: `Shorten long sentences (avg is ${meta.avgWordsPerSentence} words). Aim for ≤ 25 so AI can extract clean quotes.`,
      example: `<!-- Split compound sentences into single-idea statements. -->`,
    },
    'og-preview': {
      fix: 'Add an Open Graph description so AI and social previews have a clean summary to show.',
      example: `<meta property="og:description" content="A 120–160 character summary of ${topic}.">`,
    },
    'freshness-signal': {
      fix: 'Pair clear H2 sections with JSON-LD structured data so AI can map your topic reliably.',
      example: `<h2>Overview</h2>\n<h2>How it works</h2>\n<!-- plus WebPage/Article JSON-LD -->`,
    },
  };
  return (
    map[id] ?? {
      fix: 'Improve this AEO signal to increase your chances of being cited by AI engines.',
      example: '<!-- See the AEO details tab for specifics. -->',
    }
  );
}
