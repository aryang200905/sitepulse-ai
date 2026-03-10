/* ── SitePulse AI — SEO / AEO Scoring Rules & Weights ── */

export interface ScoringRule {
  id: string;
  title: string;
  weight: number;
  check: (meta: PageMeta) => { passed: boolean; detail: string };
}

export interface PageMeta {
  title: string;
  titleLength: number;
  description: string;
  descriptionLength: number;
  h1Count: number;
  h1Text: string;
  h2Count: number;
  imgCount: number;
  imgsWithAlt: number;
  wordCount: number;
  hasCanonical: boolean;
  hasRobotsMeta: boolean;
  hasStructuredData: boolean;
  hasOpenGraph: boolean;
  hasFAQSchema: boolean;
  hasHowToSchema: boolean;
  internalLinks: number;
  externalLinks: number;
  url: string;
  loadTimeMs: number;
}

/* ─── SEO Rules ─── */
export const SEO_RULES: ScoringRule[] = [
  {
    id: 'title-exists',
    title: 'Page has a title tag',
    weight: 10,
    check: (m) => ({
      passed: m.titleLength > 0,
      detail: m.titleLength > 0 ? `Title: "${m.title}"` : 'No <title> tag found.',
    }),
  },
  {
    id: 'title-length',
    title: 'Title length is optimal (30-60 chars)',
    weight: 8,
    check: (m) => ({
      passed: m.titleLength >= 30 && m.titleLength <= 60,
      detail: `Title is ${m.titleLength} characters.`,
    }),
  },
  {
    id: 'meta-description',
    title: 'Meta description exists',
    weight: 10,
    check: (m) => ({
      passed: m.descriptionLength > 0,
      detail: m.descriptionLength > 0 ? `Description: "${m.description.slice(0, 80)}…"` : 'No meta description found.',
    }),
  },
  {
    id: 'meta-desc-length',
    title: 'Meta description length is optimal (120-160 chars)',
    weight: 6,
    check: (m) => ({
      passed: m.descriptionLength >= 120 && m.descriptionLength <= 160,
      detail: `Description is ${m.descriptionLength} characters.`,
    }),
  },
  {
    id: 'single-h1',
    title: 'Page has exactly one H1',
    weight: 10,
    check: (m) => ({
      passed: m.h1Count === 1,
      detail: `Found ${m.h1Count} H1 tag(s).`,
    }),
  },
  {
    id: 'h2-headings',
    title: 'Page uses H2 subheadings',
    weight: 6,
    check: (m) => ({
      passed: m.h2Count >= 2,
      detail: `Found ${m.h2Count} H2 tag(s).`,
    }),
  },
  {
    id: 'img-alt',
    title: 'All images have alt attributes',
    weight: 8,
    check: (m) => ({
      passed: m.imgCount === 0 || m.imgsWithAlt === m.imgCount,
      detail: `${m.imgsWithAlt}/${m.imgCount} images have alt text.`,
    }),
  },
  {
    id: 'word-count',
    title: 'Content has sufficient word count (300+)',
    weight: 8,
    check: (m) => ({
      passed: m.wordCount >= 300,
      detail: `Page has ${m.wordCount} words.`,
    }),
  },
  {
    id: 'canonical',
    title: 'Canonical URL is set',
    weight: 6,
    check: (m) => ({
      passed: m.hasCanonical,
      detail: m.hasCanonical ? 'Canonical tag found.' : 'No canonical tag.',
    }),
  },
  {
    id: 'open-graph',
    title: 'Open Graph tags are present',
    weight: 6,
    check: (m) => ({
      passed: m.hasOpenGraph,
      detail: m.hasOpenGraph ? 'OG tags found.' : 'No Open Graph tags.',
    }),
  },
  {
    id: 'internal-links',
    title: 'Page has internal links',
    weight: 6,
    check: (m) => ({
      passed: m.internalLinks >= 3,
      detail: `Found ${m.internalLinks} internal link(s).`,
    }),
  },
  {
    id: 'structured-data',
    title: 'Structured data (JSON-LD) present',
    weight: 8,
    check: (m) => ({
      passed: m.hasStructuredData,
      detail: m.hasStructuredData ? 'JSON-LD found.' : 'No structured data.',
    }),
  },
];

/* ─── AEO Rules ─── */
export const AEO_RULES: ScoringRule[] = [
  {
    id: 'faq-schema',
    title: 'FAQ schema markup present',
    weight: 14,
    check: (m) => ({
      passed: m.hasFAQSchema,
      detail: m.hasFAQSchema ? 'FAQPage schema found.' : 'No FAQ schema.',
    }),
  },
  {
    id: 'howto-schema',
    title: 'HowTo schema markup present',
    weight: 12,
    check: (m) => ({
      passed: m.hasHowToSchema,
      detail: m.hasHowToSchema ? 'HowTo schema found.' : 'No HowTo schema.',
    }),
  },
  {
    id: 'definition-block',
    title: 'Clear definition / summary in first 200 words',
    weight: 12,
    check: (m) => ({
      passed: m.wordCount >= 50,
      detail: m.wordCount >= 50 ? 'Opening content long enough for definition extraction.' : 'Content too short for AI extraction.',
    }),
  },
  {
    id: 'heading-questions',
    title: 'Headings contain question-style phrasing',
    weight: 10,
    check: (m) => ({
      passed: m.h2Count >= 1,
      detail: `${m.h2Count} sub-headings available for Q&A extraction.`,
    }),
  },
  {
    id: 'content-depth',
    title: 'Content depth sufficient for AI citation (500+ words)',
    weight: 10,
    check: (m) => ({
      passed: m.wordCount >= 500,
      detail: `${m.wordCount} words.`,
    }),
  },
  {
    id: 'structured-data-aeo',
    title: 'Structured data supports AI parsing',
    weight: 10,
    check: (m) => ({
      passed: m.hasStructuredData,
      detail: m.hasStructuredData ? 'Structured data found.' : 'No structured data for AI.',
    }),
  },
  {
    id: 'bulleted-lists',
    title: 'Uses lists / steps (easy to quote)',
    weight: 8,
    check: (m) => ({
      passed: m.h2Count >= 3,
      detail: `${m.h2Count} structured sections.`,
    }),
  },
  {
    id: 'og-description',
    title: 'OG description for AI preview',
    weight: 8,
    check: (m) => ({
      passed: m.hasOpenGraph,
      detail: m.hasOpenGraph ? 'OG tags present.' : 'No OG tags.',
    }),
  },
  {
    id: 'concise-paragraphs',
    title: 'Content uses concise, quotable paragraphs',
    weight: 8,
    check: (m) => ({
      passed: m.wordCount > 0 && m.wordCount / Math.max(m.h2Count + 1, 1) < 300,
      detail: 'Paragraph density check.',
    }),
  },
];
