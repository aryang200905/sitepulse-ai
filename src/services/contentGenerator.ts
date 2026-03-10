/* ── SitePulse AI — Content Generator (Draft & Blueprint) ── */

import type { DraftContent, Blueprint, SiteComplexity, Recommendation } from '@/types/analysis';

/**
 * Generate content based on site complexity.
 * EASY → full draft rewrite
 * COMPLEX → sample page + rollout plan
 */
export function generateContent(
  complexity: SiteComplexity,
  topic: string,
  recommendations: Recommendation[],
  textContent: string,
): { draft?: DraftContent; blueprint?: Blueprint } {
  if (complexity === 'EASY') {
    return { draft: generateDraft(topic, recommendations, textContent) };
  }
  return { blueprint: generateBlueprint(topic, recommendations, textContent) };
}

function generateDraft(topic: string, recommendations: Recommendation[], textContent: string): DraftContent {
  const fixSummary = recommendations.slice(0, 5).map((r) => `- ${r.fix}`).join('\n');

  const markdown = `# ${topic}

## What is ${topic}?

${topic} is a comprehensive solution designed to deliver measurable results. This page has been optimized following SEO and AEO best practices to ensure maximum visibility in both traditional search engines and AI-powered answer engines.

## Key Benefits

- **Improved Search Rankings**: Following all 12 SEO best practices
- **AI-Ready Content**: Structured for extraction by ChatGPT, Google AI Overviews, and other AI engines
- **Clear Structure**: Proper heading hierarchy, meta tags, and schema markup

## How It Works

1. Start by understanding your current position
2. Identify key areas for improvement
3. Implement changes systematically
4. Monitor results and iterate

## Frequently Asked Questions

**Q: What makes this approach effective?**
A: By combining SEO fundamentals with AEO optimization, you capture traffic from both traditional search and AI citations.

**Q: How quickly will I see results?**
A: SEO improvements typically show results within 2-4 weeks. AEO improvements may take longer as AI models update.

**Q: Do I need technical expertise?**
A: The recommendations include copy-ready code that can be implemented by anyone with basic HTML knowledge.

---

### Applied Fixes

${fixSummary}
`;

  const html = markdownToBasicHtml(markdown);

  return {
    markdown,
    html,
    preview: html,
  };
}

function generateBlueprint(topic: string, recommendations: Recommendation[], textContent: string): Blueprint {
  const sampleMarkdown = `# ${topic} — Optimized Sample Page

## Overview
This sample page demonstrates all recommended SEO and AEO improvements applied to your content.

## Core Content
${textContent.slice(0, 300)}...

## Structured Data
Add JSON-LD schema for FAQPage and HowTo to enable AI extraction.

## Internal Linking
Add contextual links to related pages within your site.
`;

  const sampleHtml = markdownToBasicHtml(sampleMarkdown);

  const rolloutPlan = `## Rollout Plan for ${topic}

### Phase 1 — Quick Wins (Week 1)
- Fix meta title and description
- Add canonical tags
- Add alt text to all images

### Phase 2 — Content Optimization (Week 2-3)
- Restructure headings (single H1, descriptive H2s)
- Add FAQ section with schema markup
- Create definition blocks for AI extraction

### Phase 3 — Advanced SEO (Week 3-4)
- Implement JSON-LD structured data
- Add Open Graph tags
- Optimize internal linking structure

### Phase 4 — AEO Enhancement (Week 4-6)
- Add HowTo schema
- Create snippet library
- Build quotable content blocks
- Test with AI engines for citation accuracy
`;

  return {
    samplePage: { markdown: sampleMarkdown, html: sampleHtml, preview: sampleHtml },
    rolloutPlan,
  };
}

function markdownToBasicHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*Q: (.+?)\*\*/g, '<strong>Q: $1</strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}
