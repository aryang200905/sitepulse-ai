/* ── SitePulse AI — SEO Audit Engine ── */

import type { SEOResult, SEOIssue, Severity } from '@/types/analysis';
import type { PageMeta } from '@/config/scoring';
import { SEO_RULES } from '@/config/scoring';

/**
 * Run all SEO scoring rules against the parsed page.
 * Returns a 0-100 score plus every check (pass/fail) and the failing subset.
 */
export function runSEOAudit(meta: PageMeta): SEOResult {
  const checks: SEOIssue[] = [];
  let earned = 0;
  let total = 0;

  for (const rule of SEO_RULES) {
    total += rule.weight;
    const result = rule.check(meta);
    if (result.passed) earned += rule.weight;

    checks.push({
      id: rule.id,
      title: rule.title,
      description: result.detail,
      passed: result.passed,
      weight: rule.weight,
      severity: severityFor(rule.weight, result.passed),
      fix: result.passed ? '' : generateFix(rule.id, meta),
      copyReadyExample: result.passed ? '' : generateExample(rule.id, meta),
    });
  }

  const score = total ? Math.round((earned / total) * 100) : 0;
  const issues = checks.filter((c) => !c.passed).sort((a, b) => b.weight - a.weight);

  return { score, issues, checks };
}

function severityFor(weight: number, passed: boolean): Severity {
  if (passed) return 'info';
  return weight >= 8 ? 'critical' : weight >= 5 ? 'warning' : 'info';
}

function generateFix(ruleId: string, meta: PageMeta): string {
  const fixes: Record<string, string> = {
    'title-exists': 'Add a descriptive <title> tag inside <head> naming the page’s primary topic.',
    'title-length': `Rewrite the title to 30–60 characters (currently ${meta.titleLength}). Lead with the keyword, then the brand.`,
    'meta-description': 'Add a <meta name="description"> summarising the page in a way that earns the click.',
    'meta-desc-length': `Adjust the meta description to 120–160 characters (currently ${meta.descriptionLength}).`,
    'single-h1': meta.h1Count === 0
      ? 'Add a single <h1> stating the page’s main topic.'
      : `Keep one <h1> and demote the other ${meta.h1Count - 1} to <h2>.`,
    'heading-structure': 'Use H2s to break the page into scannable sections and don’t skip heading levels.',
    'img-alt': `Add descriptive alt text to the ${meta.imgsMissingAlt} image(s) missing it (use alt="" only for decorative images).`,
    'word-count': `Expand the content past 300 words (currently ${meta.wordCount}) with genuinely useful detail.`,
    'canonical': 'Add <link rel="canonical"> pointing at this page’s preferred URL.',
    'indexable': 'Remove the noindex directive from the robots meta tag so search engines can index the page.',
    'viewport': 'Add a responsive viewport meta tag so the page renders correctly on mobile.',
    'lang': 'Set the document language on the <html> element, e.g. <html lang="en">.',
    'open-graph': 'Add Open Graph tags (og:title, og:description, og:image) for rich link previews.',
    'internal-links': 'Add contextual links to related pages on your site to improve crawlability.',
    'structured-data': 'Add JSON-LD structured data describing the page (WebPage/Article/Organization).',
    'https-canonical-perf': 'Reduce server response time — cache HTML, use a CDN, or cut heavy server-side work.',
  };
  return fixes[ruleId] ?? 'Review and fix this issue.';
}

function generateExample(ruleId: string, meta: PageMeta): string {
  const host = safeHost(meta.finalUrl || meta.url);
  const topic = meta.h1Text || meta.title || host;
  const desc = meta.description || `Learn about ${topic} — what it is, how it works, and how to get started.`;

  const examples: Record<string, string> = {
    'title-exists': `<title>${topic} — ${host}</title>`,
    'title-length': `<title>${clampTitle(topic)} | ${host}</title>`,
    'meta-description': `<meta name="description" content="${clampDesc(desc)}">`,
    'meta-desc-length': `<meta name="description" content="${clampDesc(desc)}">`,
    'single-h1': `<h1>${topic}</h1>`,
    'heading-structure': `<h2>Overview</h2>\n<h2>How it works</h2>\n<h2>FAQ</h2>`,
    'img-alt': `<img src="/path/to/image.jpg" alt="${topic} — describe what the image shows">`,
    'word-count': `<!-- Add sections that answer real user questions about ${topic} in depth. -->`,
    'canonical': `<link rel="canonical" href="${meta.finalUrl || meta.url}">`,
    'indexable': `<meta name="robots" content="index, follow">`,
    'viewport': `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    'lang': `<html lang="en">`,
    'open-graph': `<meta property="og:title" content="${clampTitle(topic)}">\n<meta property="og:description" content="${clampDesc(desc)}">\n<meta property="og:image" content="${meta.ogImage || `${originOf(meta)}/og-image.png`}">`,
    'internal-links': `<a href="/related-topic">Related: a page about ${topic}</a>`,
    'structured-data': jsonLdExample(topic, desc, meta),
    'https-canonical-perf': `# Add caching headers to the HTML response\nCache-Control: public, s-maxage=3600, stale-while-revalidate=86400`,
  };
  return examples[ruleId] ?? '<!-- Fix this issue -->';
}

function jsonLdExample(topic: string, desc: string, meta: PageMeta): string {
  return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "${escapeJson(clampTitle(topic))}",
  "description": "${escapeJson(clampDesc(desc))}",
  "url": "${meta.finalUrl || meta.url}"
}
</script>`;
}

function clampTitle(s: string): string {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > 55 ? `${t.slice(0, 54)}…` : t;
}

function clampDesc(s: string): string {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length >= 120 && t.length <= 160) return t;
  if (t.length > 160) return `${t.slice(0, 157)}…`;
  return t; // shorter is fine as a starting point
}

function safeHost(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return 'your-site.com';
  }
}

function originOf(meta: PageMeta): string {
  try {
    return new URL(meta.finalUrl || meta.url).origin;
  } catch {
    return 'https://your-site.com';
  }
}

function escapeJson(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
