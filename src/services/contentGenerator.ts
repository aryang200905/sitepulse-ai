/* ── SitePulse AI — Content Generator (Draft & Blueprint) ── */

import type { DraftContent, Blueprint, SiteComplexity, Recommendation, AEOModule } from '@/types/analysis';
import type { PageMeta } from '@/config/scoring';

interface GenInput {
  complexity: SiteComplexity;
  meta: PageMeta;
  recommendations: Recommendation[];
  modules: AEOModule[];
}

/**
 * Produce an optimized draft (simple pages) or a blueprint + rollout plan
 * (complex pages). Both are stitched from the REAL page (its title, headings,
 * extracted definition/FAQ) and the REAL prioritised recommendations — not
 * generic filler.
 */
export function generateContent(input: GenInput): { draft?: DraftContent; blueprint?: Blueprint } {
  if (input.complexity === 'EASY') return { draft: generateDraft(input) };
  return { blueprint: generateBlueprint(input) };
}

function moduleContent(modules: AEOModule[], type: AEOModule['type']): string | null {
  const m = modules.find((x) => x.type === type && x.source !== 'scaffold');
  return m ? m.content : null;
}

function generateDraft({ meta, recommendations, modules }: GenInput): DraftContent {
  const topic = meta.h1Text || meta.title || hostOf(meta);
  const definition = moduleContent(modules, 'definition') ?? meta.description ?? '';
  const faq = moduleContent(modules, 'faq');
  const keyFacts = moduleContent(modules, 'key-facts');
  const existingSections = meta.headings.filter((h) => h.level === 2).map((h) => h.text);

  const parts: string[] = [`# ${topic}`, ''];

  if (definition) {
    parts.push('## Direct answer', '', definition, '');
  }

  if (keyFacts) {
    parts.push('## Key facts', '', keyFacts, '');
  }

  if (existingSections.length) {
    parts.push('## Your existing sections (keep & improve)', '', existingSections.map((s) => `- ${s}`).join('\n'), '');
  }

  if (faq) {
    parts.push('## FAQ', '', faq, '');
  }

  parts.push(
    '## Highest-impact changes to apply',
    '',
    recommendations.slice(0, 6).map((r, i) => `${i + 1}. **${r.title}** — ${r.fix}`).join('\n'),
    '',
  );

  const markdown = parts.join('\n');
  const html = markdownToBasicHtml(markdown);
  return { markdown, html, preview: html };
}

function generateBlueprint({ meta, recommendations, modules }: GenInput): Blueprint {
  const topic = meta.h1Text || meta.title || hostOf(meta);
  const definition = moduleContent(modules, 'definition') ?? meta.description ?? '';
  const faq = moduleContent(modules, 'faq');

  const sampleParts: string[] = [`# ${topic} — optimized section blueprint`, ''];
  if (definition) sampleParts.push('## Lead with a direct answer', '', definition, '');
  sampleParts.push(
    '## Recommended section order',
    '',
    ['Direct answer (2–3 sentences)', 'Key facts / at-a-glance', 'How it works', 'Comparisons / use cases', 'FAQ with schema']
      .map((s, i) => `${i + 1}. ${s}`)
      .join('\n'),
    '',
  );
  if (faq) sampleParts.push('## FAQ block to embed', '', faq, '');

  const sampleMarkdown = sampleParts.join('\n');
  const sampleHtml = markdownToBasicHtml(sampleMarkdown);

  // Group real recommendations into phases by priority.
  const quick = recommendations.filter((r) => r.priority === 'Quick-Win').map((r) => `- ${r.fix}`);
  const high = recommendations.filter((r) => r.priority === 'High-Impact').map((r) => `- ${r.fix}`);
  const rest = recommendations.filter((r) => r.priority === 'Medium' || r.priority === 'Low-Priority').map((r) => `- ${r.fix}`);

  const rolloutPlan = [
    `## Rollout plan for ${hostOf(meta)}`,
    '',
    '### Phase 1 — Quick wins (this week)',
    quick.length ? quick.join('\n') : '- No quick wins outstanding — nice work.',
    '',
    '### Phase 2 — High-impact structure (weeks 2–3)',
    high.length ? high.join('\n') : '- No high-impact items outstanding.',
    '',
    '### Phase 3 — Depth & polish (weeks 3–4)',
    rest.length ? rest.join('\n') : '- Everything else is in good shape.',
    '',
    '### Phase 4 — Validate',
    '- Re-run SitePulse AI to confirm score gains',
    '- Validate all JSON-LD at validator.schema.org',
    '- Spot-check the page in ChatGPT / Google AI Overviews for citation accuracy',
  ].join('\n');

  return { samplePage: { markdown: sampleMarkdown, html: sampleHtml, preview: sampleHtml }, rolloutPlan };
}

function hostOf(meta: PageMeta): string {
  try {
    return new URL(meta.finalUrl || meta.url).hostname.replace(/^www\./, '');
  } catch {
    return 'your site';
  }
}

function markdownToBasicHtml(md: string): string {
  const lines = md.split('\n');
  const html: string[] = [];
  let inList = false;
  const closeList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };

  for (const line of lines) {
    if (/^### /.test(line)) {
      closeList();
      html.push(`<h3>${inline(line.slice(4))}</h3>`);
    } else if (/^## /.test(line)) {
      closeList();
      html.push(`<h2>${inline(line.slice(3))}</h2>`);
    } else if (/^# /.test(line)) {
      closeList();
      html.push(`<h1>${inline(line.slice(2))}</h1>`);
    } else if (/^\s*[-*] /.test(line)) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${inline(line.replace(/^\s*[-*] /, ''))}</li>`);
    } else if (/^\s*\d+\.\s/.test(line)) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${inline(line.replace(/^\s*\d+\.\s/, ''))}</li>`);
    } else if (line.trim() === '') {
      closeList();
    } else {
      closeList();
      html.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  return html.join('\n');
}

function inline(s: string): string {
  return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
