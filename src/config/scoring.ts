/* ── SitePulse AI — SEO / AEO Scoring Rules & Weights ── */

export interface Heading {
  level: number; // 1-6
  text: string;
}

export interface JsonLdEntity {
  type: string; // e.g. "FAQPage", "Article"
}

/**
 * Rich, structured snapshot of a page. Produced by the parser and consumed by
 * every audit/generator. Every field is measured from the real document — no
 * placeholders.
 */
export interface PageMeta {
  // Request / performance
  url: string;
  finalUrl: string;
  httpStatus: number;
  loadTimeMs: number;
  htmlBytes: number;

  // Head
  title: string;
  titleLength: number;
  description: string;
  descriptionLength: number;
  canonical: string;
  hasCanonical: boolean;
  robots: string;
  hasRobotsMeta: boolean;
  robotsNoindex: boolean;
  lang: string;
  hasViewport: boolean;
  charset: string;

  // Social
  hasOpenGraph: boolean;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  hasTwitterCard: boolean;

  // Headings
  headings: Heading[];
  h1Count: number;
  h1Text: string;
  h2Count: number;
  headingOrderValid: boolean;
  questionHeadings: string[];

  // Content
  wordCount: number;
  firstParagraph: string;
  paragraphCount: number;
  listCount: number;
  listItemCount: number;
  orderedListCount: number;
  tableCount: number;
  avgWordsPerSentence: number;

  // Images
  imgCount: number;
  imgsWithAlt: number;
  imgsMissingAlt: number;

  // Links
  internalLinks: number;
  externalLinks: number;
  nofollowLinks: number;

  // Structured data
  jsonLd: JsonLdEntity[];
  schemaTypes: string[];
  hasStructuredData: boolean;
  hasFAQSchema: boolean;
  hasHowToSchema: boolean;
  hasArticleSchema: boolean;
  hasBreadcrumbSchema: boolean;
  hasOrganizationSchema: boolean;
}

export interface RuleResult {
  passed: boolean;
  detail: string;
}

export interface ScoringRule {
  id: string;
  title: string;
  weight: number;
  check: (m: PageMeta) => RuleResult;
}

/* ─────────────────────────── SEO Rules ─────────────────────────── */
export const SEO_RULES: ScoringRule[] = [
  {
    id: 'title-exists',
    title: 'Page has a title tag',
    weight: 10,
    check: (m) => ({
      passed: m.titleLength > 0,
      detail: m.titleLength > 0 ? `Title: "${m.title}"` : 'No <title> tag was found in the page <head>.',
    }),
  },
  {
    id: 'title-length',
    title: 'Title length is optimal (30–60 characters)',
    weight: 7,
    check: (m) => ({
      passed: m.titleLength >= 30 && m.titleLength <= 60,
      detail:
        m.titleLength === 0
          ? 'No title to measure.'
          : m.titleLength < 30
            ? `Title is only ${m.titleLength} characters — too short to be descriptive.`
            : m.titleLength > 60
              ? `Title is ${m.titleLength} characters and will be truncated in search results.`
              : `Title is ${m.titleLength} characters.`,
    }),
  },
  {
    id: 'meta-description',
    title: 'Meta description exists',
    weight: 9,
    check: (m) => ({
      passed: m.descriptionLength > 0,
      detail: m.descriptionLength > 0 ? `Description: "${truncate(m.description, 90)}"` : 'No meta description tag found.',
    }),
  },
  {
    id: 'meta-desc-length',
    title: 'Meta description length is optimal (120–160 characters)',
    weight: 5,
    check: (m) => ({
      passed: m.descriptionLength >= 120 && m.descriptionLength <= 160,
      detail:
        m.descriptionLength === 0
          ? 'No description to measure.'
          : `Description is ${m.descriptionLength} characters ${m.descriptionLength < 120 ? '(too short — you have room to add detail)' : m.descriptionLength > 160 ? '(will be truncated in search results)' : ''}.`.trim(),
    }),
  },
  {
    id: 'single-h1',
    title: 'Page has exactly one H1',
    weight: 9,
    check: (m) => ({
      passed: m.h1Count === 1,
      detail:
        m.h1Count === 0
          ? 'No H1 heading found — search engines rely on it as the page’s main topic.'
          : m.h1Count === 1
            ? `One H1: "${truncate(m.h1Text, 80)}"`
            : `Found ${m.h1Count} H1 tags — this dilutes the page’s primary topic signal.`,
    }),
  },
  {
    id: 'heading-structure',
    title: 'Content is structured with H2 subheadings in order',
    weight: 6,
    check: (m) => ({
      passed: m.h2Count >= 2 && m.headingOrderValid,
      detail: !m.headingOrderValid
        ? `Heading levels are skipped (e.g. H2 → H4). Found ${m.h2Count} H2(s).`
        : `Found ${m.h2Count} H2 subheading(s).`,
    }),
  },
  {
    id: 'img-alt',
    title: 'Images have descriptive alt text',
    weight: 6,
    check: (m) => ({
      passed: m.imgCount === 0 || m.imgsMissingAlt === 0,
      detail:
        m.imgCount === 0
          ? 'No images on the page.'
          : `${m.imgsMissingAlt} of ${m.imgCount} image(s) are missing alt text.`,
    }),
  },
  {
    id: 'word-count',
    title: 'Page has enough content (300+ words)',
    weight: 7,
    check: (m) => ({
      passed: m.wordCount >= 300,
      detail: `Page has ${m.wordCount} words of visible text${m.wordCount < 300 ? ' — thin content ranks poorly.' : '.'}`,
    }),
  },
  {
    id: 'canonical',
    title: 'Canonical URL is declared',
    weight: 5,
    check: (m) => ({
      passed: m.hasCanonical,
      detail: m.hasCanonical ? `Canonical: ${m.canonical}` : 'No canonical link — risks duplicate-content dilution.',
    }),
  },
  {
    id: 'indexable',
    title: 'Page is indexable by search engines',
    weight: 8,
    check: (m) => ({
      passed: !m.robotsNoindex,
      detail: m.robotsNoindex
        ? `robots meta is set to noindex ("${m.robots}") — this page is hidden from search.`
        : 'Page is not blocked by a robots noindex directive.',
    }),
  },
  {
    id: 'viewport',
    title: 'Mobile viewport is configured',
    weight: 4,
    check: (m) => ({
      passed: m.hasViewport,
      detail: m.hasViewport ? 'Responsive viewport meta present.' : 'No viewport meta — page will not render well on mobile.',
    }),
  },
  {
    id: 'lang',
    title: 'Document language is declared',
    weight: 3,
    check: (m) => ({
      passed: !!m.lang,
      detail: m.lang ? `lang="${m.lang}"` : 'No <html lang="…"> attribute — hurts accessibility and localisation.',
    }),
  },
  {
    id: 'open-graph',
    title: 'Open Graph tags for rich social previews',
    weight: 4,
    check: (m) => ({
      passed: m.hasOpenGraph,
      detail: m.hasOpenGraph ? `OG present (title/${m.ogTitle ? '✓' : '✗'}, image/${m.ogImage ? '✓' : '✗'}).` : 'No Open Graph tags.',
    }),
  },
  {
    id: 'internal-links',
    title: 'Page links to other pages on the site',
    weight: 5,
    check: (m) => ({
      passed: m.internalLinks >= 3,
      detail: `Found ${m.internalLinks} internal link(s)${m.internalLinks < 3 ? ' — add contextual links to aid crawling.' : '.'}`,
    }),
  },
  {
    id: 'structured-data',
    title: 'Structured data (JSON-LD) present',
    weight: 7,
    check: (m) => ({
      passed: m.hasStructuredData,
      detail: m.hasStructuredData ? `Schema types: ${m.schemaTypes.join(', ') || 'present'}.` : 'No JSON-LD structured data found.',
    }),
  },
  {
    id: 'https-canonical-perf',
    title: 'Page responds quickly (< 2.5s to first byte of HTML)',
    weight: 5,
    check: (m) => ({
      passed: m.loadTimeMs > 0 && m.loadTimeMs < 2500,
      detail: m.loadTimeMs > 0 ? `HTML fetched in ${m.loadTimeMs} ms.` : 'Load time not measured.',
    }),
  },
];

/* ─────────────────────────── AEO Rules ─────────────────────────── */
export const AEO_RULES: ScoringRule[] = [
  {
    id: 'faq-schema',
    title: 'FAQPage schema markup present',
    weight: 14,
    check: (m) => ({
      passed: m.hasFAQSchema,
      detail: m.hasFAQSchema ? 'FAQPage schema found — great for AI Q&A extraction.' : 'No FAQPage schema.',
    }),
  },
  {
    id: 'answer-first',
    title: 'Page opens with a direct, quotable answer',
    weight: 12,
    check: (m) => {
      const p = m.firstParagraph.trim();
      const words = p.split(/\s+/).filter(Boolean).length;
      const passed = words >= 20 && words <= 90;
      return {
        passed,
        detail: !p
          ? 'No leading paragraph detected — AI engines have nothing concise to quote.'
          : passed
            ? `Opening paragraph is ${words} words — a good quotable length.`
            : `Opening paragraph is ${words} words${words < 20 ? ' — too short to answer a query.' : ' — too long for AI engines to cite cleanly.'}`,
      };
    },
  },
  {
    id: 'question-headings',
    title: 'Headings phrased as real questions',
    weight: 11,
    check: (m) => ({
      passed: m.questionHeadings.length >= 1,
      detail:
        m.questionHeadings.length >= 1
          ? `${m.questionHeadings.length} question-style heading(s), e.g. "${truncate(m.questionHeadings[0], 60)}"`
          : 'No question-style headings — these are what AI engines match against user prompts.',
    }),
  },
  {
    id: 'content-depth',
    title: 'Content depth sufficient for AI citation (600+ words)',
    weight: 10,
    check: (m) => ({
      passed: m.wordCount >= 600,
      detail: `${m.wordCount} words. AI engines favour thorough, authoritative pages.`,
    }),
  },
  {
    id: 'howto-schema',
    title: 'HowTo schema for step-by-step queries',
    weight: 8,
    check: (m) => ({
      passed: m.hasHowToSchema,
      detail: m.hasHowToSchema ? 'HowTo schema found.' : 'No HowTo schema (add it if the page explains a process).',
    }),
  },
  {
    id: 'lists-steps',
    title: 'Uses lists or steps AI engines can lift verbatim',
    weight: 9,
    check: (m) => ({
      passed: m.listCount >= 1 && m.listItemCount >= 3,
      detail:
        m.listCount >= 1
          ? `${m.listCount} list(s) with ${m.listItemCount} items.`
          : 'No bulleted or numbered lists found — these are the easiest content for AI to quote.',
    }),
  },
  {
    id: 'entity-schema',
    title: 'Entity structured data (Article / Organization / Breadcrumb)',
    weight: 8,
    check: (m) => {
      const has = m.hasArticleSchema || m.hasOrganizationSchema || m.hasBreadcrumbSchema;
      return {
        passed: has,
        detail: has
          ? `Entity schema present: ${[m.hasArticleSchema && 'Article', m.hasOrganizationSchema && 'Organization', m.hasBreadcrumbSchema && 'BreadcrumbList'].filter(Boolean).join(', ')}.`
          : 'No Article/Organization/Breadcrumb schema — these help AI attribute and trust your content.',
      };
    },
  },
  {
    id: 'concise-sentences',
    title: 'Sentences are concise and quotable (≤ 25 words avg)',
    weight: 8,
    check: (m) => ({
      passed: m.avgWordsPerSentence > 0 && m.avgWordsPerSentence <= 25,
      detail:
        m.avgWordsPerSentence > 0
          ? `Average sentence length is ${m.avgWordsPerSentence} words${m.avgWordsPerSentence > 25 ? ' — long sentences are harder for AI to extract cleanly.' : '.'}`
          : 'Not enough prose to measure sentence length.',
    }),
  },
  {
    id: 'og-preview',
    title: 'Social/OG description for AI preview cards',
    weight: 6,
    check: (m) => ({
      passed: m.hasOpenGraph && !!m.ogDescription,
      detail: m.hasOpenGraph && m.ogDescription ? 'OG description present.' : 'No OG description for AI/social previews.',
    }),
  },
  {
    id: 'freshness-signal',
    title: 'Machine-readable topic via headings + schema',
    weight: 6,
    check: (m) => ({
      passed: m.h2Count >= 2 && m.hasStructuredData,
      detail:
        m.h2Count >= 2 && m.hasStructuredData
          ? 'Clear section structure plus structured data — easy for AI to map the topic.'
          : 'Combine clear H2 sections with JSON-LD so AI can map your topic reliably.',
    }),
  },
];

function truncate(s: string, n: number): string {
  if (!s) return '';
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
