/* ── SitePulse AI — SEO Audit Engine ── */

import type { SEOResult, SEOIssue } from '@/types/analysis';
import type { PageMeta } from '@/config/scoring';
import { SEO_RULES } from '@/config/scoring';

/**
 * Run all SEO scoring rules against page metadata.
 * Returns a 0-100 score and a list of issues for failures.
 */
export function runSEOAudit(meta: PageMeta): SEOResult {
  const issues: SEOIssue[] = [];
  let earned = 0;
  let total = 0;

  for (const rule of SEO_RULES) {
    total += rule.weight;
    const result = rule.check(meta);

    if (result.passed) {
      earned += rule.weight;
    } else {
      issues.push({
        id: rule.id,
        title: rule.title,
        description: result.detail,
        severity: rule.weight >= 10 ? 'critical' : rule.weight >= 6 ? 'warning' : 'info',
        fix: generateFix(rule.id, meta),
        copyReadyExample: generateExample(rule.id, meta),
      });
    }
  }

  const score = Math.round((earned / total) * 100);
  return { score, issues };
}

function generateFix(ruleId: string, meta: PageMeta): string {
  const fixes: Record<string, string> = {
    'title-exists': 'Add a descriptive <title> tag to your page.',
    'title-length': `Adjust your title to 30-60 characters (currently ${meta.titleLength}).`,
    'meta-description': 'Add a <meta name="description"> tag with a compelling summary.',
    'meta-desc-length': `Adjust your meta description to 120-160 characters (currently ${meta.descriptionLength}).`,
    'single-h1': `Ensure only one <h1> tag on the page (currently ${meta.h1Count}).`,
    'h2-headings': 'Add H2 subheadings to structure your content.',
    'img-alt': 'Add descriptive alt attributes to all images.',
    'word-count': `Add more content — aim for 300+ words (currently ${meta.wordCount}).`,
    'canonical': 'Add <link rel="canonical" href="..."> to specify the canonical URL.',
    'open-graph': 'Add Open Graph meta tags (og:title, og:description, og:image).',
    'internal-links': 'Add more internal links to improve site navigation and crawlability.',
    'structured-data': 'Add JSON-LD structured data to help search engines understand your content.',
  };
  return fixes[ruleId] ?? 'Review and fix this issue.';
}

function generateExample(ruleId: string, meta: PageMeta): string {
  const examples: Record<string, string> = {
    'title-exists': `<title>${meta.url.replace(/https?:\/\//, '').split('/')[0]} — Your Page Title</title>`,
    'title-length': `<title>Your Optimized Title Here (30-60 chars)</title>`,
    'meta-description': `<meta name="description" content="A compelling 120-160 character description of your page content that encourages clicks from search results.">`,
    'meta-desc-length': `<meta name="description" content="Update this to be between 120-160 characters for optimal search display.">`,
    'single-h1': `<h1>Your Primary Page Heading</h1>`,
    'h2-headings': `<h2>Section Title</h2>\n<p>Section content...</p>`,
    'img-alt': `<img src="image.jpg" alt="Descriptive text about the image">`,
    'word-count': `Add more detailed, valuable content covering your topic thoroughly.`,
    'canonical': `<link rel="canonical" href="${meta.url}">`,
    'open-graph': `<meta property="og:title" content="Page Title">\n<meta property="og:description" content="Page description">\n<meta property="og:image" content="https://example.com/image.jpg">`,
    'internal-links': `<a href="/related-page">Related Topic</a>`,
    'structured-data': `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "Page Title"\n}\n</script>`,
  };
  return examples[ruleId] ?? '<!-- Fix this issue -->';
}
