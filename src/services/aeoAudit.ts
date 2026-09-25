/* ── SitePulse AI — AEO Audit + Grounded Content Generation ── */

import type { AEOResult, AEOModule, SEOIssue } from '@/types/analysis';
import type { PageMeta } from '@/config/scoring';
import { AEO_RULES } from '@/config/scoring';
import type { ParsedPage } from '@/services/parser';
import { llm } from '@/services/llmOrchestrator';

interface GroundedContent {
  definition: string;
  faqs: { question: string; answer: string }[];
  keyFacts: string[];
  howToSteps: string[];
}

/**
 * Score the page for AI/answer-engine readiness and build a set of content
 * modules that are GROUNDED IN THE REAL PAGE — either LLM-generated from the
 * actual content, or extracted directly from it. Never invented boilerplate.
 */
export async function runAEOAudit(parsed: ParsedPage): Promise<{ result: AEOResult; aiEnhanced: boolean }> {
  const { meta } = parsed;

  // ── Deterministic scoring against real signals ──
  const checks: SEOIssue[] = [];
  let earned = 0;
  let total = 0;
  for (const rule of AEO_RULES) {
    total += rule.weight;
    const r = rule.check(meta);
    if (r.passed) earned += rule.weight;
    checks.push({
      id: rule.id,
      title: rule.title,
      description: r.detail,
      passed: r.passed,
      weight: rule.weight,
      severity: r.passed ? 'info' : rule.weight >= 10 ? 'critical' : rule.weight >= 7 ? 'warning' : 'info',
      fix: '',
      copyReadyExample: '',
    });
  }
  const score = total ? Math.round((earned / total) * 100) : 0;

  // ── Grounded content ──
  const { grounded, aiEnhanced } = await buildGroundedContent(parsed);
  const modules = buildModules(parsed, grounded, aiEnhanced);

  return { result: { score, modules, checks }, aiEnhanced };
}

/* ─────────────────── grounded content assembly ─────────────────── */

async function buildGroundedContent(parsed: ParsedPage): Promise<{ grounded: GroundedContent; aiEnhanced: boolean }> {
  // 1) Try the LLM first — grounded strictly in the extracted page content.
  if (llm.isAvailable) {
    const ai = await generateWithLLM(parsed);
    if (ai) return { grounded: ai, aiEnhanced: true };
  }
  // 2) Deterministic, honest extraction from the real page.
  return { grounded: extractDeterministic(parsed), aiEnhanced: false };
}

async function generateWithLLM(parsed: ParsedPage): Promise<GroundedContent | null> {
  const { meta, mainText } = parsed;
  const system =
    'You are an Answer Engine Optimization (AEO) specialist. You write content that AI search ' +
    'engines (ChatGPT, Google AI Overviews, Perplexity) can cite. You ground everything strictly ' +
    'in the provided page content and never invent facts, prices, features, or claims that are not ' +
    'supported by it. If the page lacks information for a field, return an empty value for it.';

  const context = [
    `URL: ${meta.finalUrl}`,
    `Title: ${meta.title}`,
    `Meta description: ${meta.description}`,
    `Headings: ${meta.headings.slice(0, 25).map((h) => `H${h.level} ${h.text}`).join(' | ')}`,
    `Existing on-page questions: ${meta.questionHeadings.join(' | ') || '(none)'}`,
    '',
    'Page text (truncated):',
    mainText.slice(0, 6000),
  ].join('\n');

  const user =
    `${context}\n\n` +
    'From ONLY the content above, produce JSON with this exact shape:\n' +
    '{\n' +
    '  "definition": "2-3 sentence, quotable definition/summary of what this page is about",\n' +
    '  "faqs": [{"question": "...", "answer": "concise 1-3 sentence answer"}],  // 4-8 items, grounded in the page\n' +
    '  "keyFacts": ["short factual, quotable statement", ...],  // 3-6 items\n' +
    '  "howToSteps": ["imperative step", ...]  // only if the page describes a process, else []\n' +
    '}';

  const data = await llm.completeJSON<Partial<GroundedContent>>(system, user, { maxTokens: 1600 });
  if (!data || typeof data.definition !== 'string') return null;

  return {
    definition: (data.definition || '').trim(),
    faqs: Array.isArray(data.faqs) ? data.faqs.filter((f) => f && f.question && f.answer).slice(0, 8) : [],
    keyFacts: Array.isArray(data.keyFacts) ? data.keyFacts.filter(Boolean).slice(0, 6) : [],
    howToSteps: Array.isArray(data.howToSteps) ? data.howToSteps.filter(Boolean).slice(0, 10) : [],
  };
}

function extractDeterministic(parsed: ParsedPage): GroundedContent {
  const { meta, mainText, qaPairs, steps } = parsed;

  const definition = meta.firstParagraph || meta.description || '';

  return {
    definition,
    faqs: qaPairs.slice(0, 8),
    keyFacts: extractKeyFacts(mainText, meta),
    howToSteps: steps,
  };
}

/** Pull genuinely quotable declarative sentences out of the real page text. */
function extractKeyFacts(textContent: string, meta: PageMeta): string[] {
  const brand = safeHost(meta.finalUrl || meta.url);
  const sentences = textContent
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => {
      const words = s.split(/\s+/).length;
      if (words < 6 || words > 26) return false;
      if (s.includes('?')) return false;
      if (!/[.!]$/.test(s)) return false; // must read as a complete statement
      if (/cookie|privacy policy|terms|subscribe|newsletter|sign ?in|log ?in|download now|get started|read more|learn more|updated:|©/i.test(s)) return false;
      return true;
    });

  // Prefer sentences that contain a number/stat or the brand — they read as facts.
  const scored = sentences
    .map((s) => ({ s, score: (/\d/.test(s) ? 2 : 0) + (s.toLowerCase().includes(brand.split('.')[0]) ? 1 : 0) }))
    .sort((a, b) => b.score - a.score);

  const out: string[] = [];
  for (const { s } of scored) {
    const norm = s.toLowerCase().replace(/[^a-z0-9 ]/g, '');
    // Skip if it substantially overlaps something already chosen.
    if (out.some((o) => {
      const on = o.toLowerCase().replace(/[^a-z0-9 ]/g, '');
      return on.includes(norm) || norm.includes(on);
    })) continue;
    out.push(s);
    if (out.length >= 5) break;
  }
  return out;
}

/* ─────────────────────────── modules ─────────────────────────── */

function buildModules(parsed: ParsedPage, g: GroundedContent, ai: boolean): AEOModule[] {
  const { meta } = parsed;
  const topic = meta.h1Text || meta.title || safeHost(meta.finalUrl || meta.url);
  const modules: AEOModule[] = [];
  const src = ai ? 'ai' : 'extracted';

  // 1) Definition block
  if (g.definition) {
    modules.push({
      id: 'definition',
      type: 'definition',
      title: '📖 Direct-Answer Definition',
      content: g.definition,
      source: src,
      note: ai
        ? 'Written by AI from your page content — quotable by AI engines.'
        : 'Extracted from your page’s opening content.',
    });
  } else {
    modules.push({
      id: 'definition',
      type: 'definition',
      title: '📖 Direct-Answer Definition',
      content: `[Add a 2–3 sentence answer to “What is ${topic}?” at the very top of the page. AI engines quote the first clear answer they find.]`,
      source: 'scaffold',
      note: 'Your page has no clear opening answer to extract — add one using this scaffold.',
    });
  }

  // 2) FAQ (human-readable)
  if (g.faqs.length) {
    modules.push({
      id: 'faq',
      type: 'faq',
      title: '❓ FAQ Section',
      content: g.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n'),
      source: src,
      note: ai
        ? `AI-drafted from your content (${g.faqs.length} Q&As). Review answers before publishing.`
        : `Built from ${g.faqs.length} question(s) found on your page.`,
    });

    // 3) FAQ JSON-LD — built from the ACTUAL Q&As above, so it is valid & real.
    modules.push({
      id: 'faq-jsonld',
      type: 'faq-jsonld',
      title: '🏷️ FAQ JSON-LD Schema',
      content: faqJsonLd(g.faqs),
      source: src,
      note: 'Paste into <head>. Validate at validator.schema.org before shipping.',
    });
  } else {
    modules.push({
      id: 'faq',
      type: 'faq',
      title: '❓ FAQ Section',
      content:
        `[No Q&A content was found on the page. Add a FAQ answering the real questions your ` +
        `audience asks about ${topic}, then wrap it in FAQPage schema.]`,
      source: 'scaffold',
      note: 'Add real questions your customers ask — AI engines match these against user prompts.',
    });
  }

  // 4) Key facts / quotable snippets
  if (g.keyFacts.length) {
    modules.push({
      id: 'key-facts',
      type: 'key-facts',
      title: '✂️ Quotable Key Facts',
      content: g.keyFacts.map((f, i) => `${i + 1}. ${f}`).join('\n'),
      source: src,
      note: ai ? 'AI-selected quotable statements grounded in your page.' : 'Pulled from sentences already on your page.',
    });
  }

  // 5) How-to steps (only when the page actually describes a process)
  if (g.howToSteps.length) {
    modules.push({
      id: 'how-to',
      type: 'how-to',
      title: '📋 How-To Steps + Schema',
      content: `${g.howToSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n${howToJsonLd(topic, g.howToSteps)}`,
      source: src,
      note: ai ? 'AI-structured from your content.' : 'Extracted from an ordered list on your page.',
    });
  }

  return modules;
}

function faqJsonLd(faqs: { question: string; answer: string }[]): string {
  const entities = faqs.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  }));
  const schema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: entities };
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

function howToJsonLd(name: string, steps: string[]): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to get started with ${name}`,
    step: steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, text: s })),
  };
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

function safeHost(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return 'your-site.com';
  }
}
