/* ── SitePulse AI — URL Fetch & Real HTML Parsing ── */

import * as cheerio from 'cheerio';
import type { PageMeta, Heading, JsonLdEntity } from '@/config/scoring';

export interface ParsedPage {
  meta: PageMeta;
  /** Cleaned, visible text of the whole body. */
  textContent: string;
  /** Cleaned text of just the main content region (nav/header/footer removed). */
  mainText: string;
  /** Question → nearby answer pairs actually found on the page. */
  qaPairs: { question: string; answer: string }[];
  /** Ordered-list / step sequences actually found on the page. */
  steps: string[];
}

// CTA / chrome phrases that signal boilerplate rather than real content.
const BOILERPLATE_RE =
  /\b(download now|sign up|log ?in|subscribe|newsletter|get started|read more|learn more|skip to|cookie|privacy policy|terms of|all rights reserved|©|updated:)\b/i;

// A realistic desktop browser UA — many sites 403 the default fetch UA.
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Fetch a URL and turn it into a structured PageMeta plus the content our
 * generators need. Throws with a descriptive message on network / status
 * failures so the route can classify anti-bot responses.
 */
export async function parsePage(url: string): Promise<ParsedPage> {
  const started = Date.now();

  const res = await fetch(url, {
    headers: {
      'User-Agent': BROWSER_UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(20_000),
  });

  const loadTimeMs = Date.now() - started;

  if (!res.ok) {
    // Encode status so the route can detect anti-bot codes (403/401/406/5xx).
    throw new Error(`Failed to fetch page: ${res.status}`);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!/text\/html|application\/xhtml/i.test(contentType) && contentType) {
    throw new Error(`URL did not return an HTML document (content-type: ${contentType}).`);
  }

  const html = await res.text();
  const htmlBytes = Buffer.byteLength(html, 'utf8');
  const finalUrl = res.url || url;

  return buildParsedPage(html, url, finalUrl, res.status, loadTimeMs, htmlBytes);
}

/** Pure parsing — separated so it is unit-testable without a network call. */
export function buildParsedPage(
  html: string,
  requestedUrl: string,
  finalUrl: string,
  httpStatus: number,
  loadTimeMs: number,
  htmlBytes: number,
): ParsedPage {
  const $ = cheerio.load(html);

  // Strip non-content nodes before extracting visible text.
  $('script, style, noscript, template, svg, iframe').remove();

  const base = safeUrl(finalUrl);

  // ── Head / meta ──
  const title = ($('head > title').first().text() || $('title').first().text() || '').trim();
  const description = metaContent($, 'description');
  const robots = metaContent($, 'robots');
  const canonical = $('link[rel="canonical"]').attr('href')?.trim() ?? '';
  const lang = $('html').attr('lang')?.trim() ?? '';
  const charset =
    $('meta[charset]').attr('charset') ??
    (/charset=([\w-]+)/i.exec($('meta[http-equiv="Content-Type"]').attr('content') ?? '')?.[1] ?? '') ??
    '';
  const hasViewport = $('meta[name="viewport"]').length > 0;

  // ── Open Graph / Twitter ──
  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() ?? '';
  const ogDescription = $('meta[property="og:description"]').attr('content')?.trim() ?? '';
  const ogImage = $('meta[property="og:image"]').attr('content')?.trim() ?? '';
  const ogType = $('meta[property="og:type"]').attr('content')?.trim() ?? '';
  const hasOpenGraph = $('meta[property^="og:"]').length > 0;
  const hasTwitterCard = $('meta[name^="twitter:"]').length > 0;

  // ── Headings ──
  const headings: Heading[] = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const level = Number(el.tagName.slice(1));
    const text = cleanText($(el).text());
    if (text) headings.push({ level, text });
  });
  const h1s = headings.filter((h) => h.level === 1);
  const h2s = headings.filter((h) => h.level === 2);
  const headingOrderValid = checkHeadingOrder(headings);
  const questionHeadings = headings.filter((h) => isQuestion(h.text)).map((h) => h.text);

  // ── Body content ──
  // Full body text (used for word count) keeps everything.
  const textContent = cleanText($('body').text());

  // For CONTENT extraction, work on a clone with obvious chrome removed so we
  // don't pollute definitions/facts — without disturbing link/image counts.
  const contentRoot = $('main').length ? $('main') : $('article').length ? $('article') : $('body');
  const contentClone = contentRoot.clone();
  contentClone.find('nav, header, footer, aside, form, [role="navigation"], [role="banner"], [role="contentinfo"]').remove();

  const paragraphs: string[] = [];
  contentClone.find('p').each((_, el) => {
    const t = cleanText($(el).text());
    if (t.split(/\s+/).length >= 6 && !BOILERPLATE_RE.test(t)) paragraphs.push(t);
  });
  const firstParagraph = paragraphs[0] ?? '';
  const mainText =
    cleanText(contentClone.find('p, li').toArray().map((el) => $(el).text()).join(' ')) || cleanText(contentClone.text());
  const wordCount = textContent ? textContent.split(/\s+/).filter(Boolean).length : 0;

  const sentences = textContent
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 3);
  const avgWordsPerSentence = sentences.length
    ? Math.round(sentences.reduce((n, s) => n + s.split(/\s+/).length, 0) / sentences.length)
    : 0;

  // ── Lists / tables ──
  const listCount = $('ul, ol').length;
  const orderedListCount = $('ol').length;
  const listItemCount = $('li').length;
  const tableCount = $('table').length;

  // ── Images ──
  const imgs = $('img').toArray();
  const imgCount = imgs.length;
  let imgsWithAlt = 0;
  let imgsMissingAlt = 0;
  for (const el of imgs) {
    const alt = $(el).attr('alt');
    // A present-but-empty alt is a valid "decorative" signal — not counted as missing.
    if (alt === undefined) imgsMissingAlt++;
    else if (alt.trim().length > 0) imgsWithAlt++;
  }

  // ── Links ──
  let internalLinks = 0;
  let externalLinks = 0;
  let nofollowLinks = 0;
  const seen = new Set<string>();
  $('a[href]').each((_, el) => {
    const href = ($(el).attr('href') ?? '').trim();
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
    const resolved = resolve(href, base);
    if (!resolved) return;
    if (seen.has(resolved)) return;
    seen.add(resolved);
    if (/nofollow/i.test($(el).attr('rel') ?? '')) nofollowLinks++;
    if (base && sameHost(resolved, base)) internalLinks++;
    else externalLinks++;
  });

  // ── Structured data (real JSON-LD parse) ──
  const jsonLd = parseJsonLd(html);
  const schemaTypes = Array.from(new Set(jsonLd.map((e) => e.type))).filter(Boolean);
  const hasStructuredData = jsonLd.length > 0;
  const hasType = (t: RegExp) => schemaTypes.some((s) => t.test(s));

  const meta: PageMeta = {
    url: requestedUrl,
    finalUrl,
    httpStatus,
    loadTimeMs,
    htmlBytes,

    title,
    titleLength: title.length,
    description,
    descriptionLength: description.length,
    canonical,
    hasCanonical: !!canonical,
    robots,
    hasRobotsMeta: !!robots,
    robotsNoindex: /noindex/i.test(robots),
    lang,
    hasViewport,
    charset: (charset || '').toString(),

    hasOpenGraph,
    ogTitle,
    ogDescription,
    ogImage,
    ogType,
    hasTwitterCard,

    headings,
    h1Count: h1s.length,
    h1Text: h1s[0]?.text ?? '',
    h2Count: h2s.length,
    headingOrderValid,
    questionHeadings,

    wordCount,
    firstParagraph,
    paragraphCount: paragraphs.length,
    listCount,
    listItemCount,
    orderedListCount,
    tableCount,
    avgWordsPerSentence,

    imgCount,
    imgsWithAlt,
    imgsMissingAlt,

    internalLinks,
    externalLinks,
    nofollowLinks,

    jsonLd,
    schemaTypes,
    hasStructuredData,
    hasFAQSchema: hasType(/FAQPage/i),
    hasHowToSchema: hasType(/HowTo/i),
    hasArticleSchema: hasType(/Article|BlogPosting|NewsArticle/i),
    hasBreadcrumbSchema: hasType(/BreadcrumbList/i),
    hasOrganizationSchema: hasType(/Organization|LocalBusiness/i),
  };

  const qaPairs = extractQAPairs($, headings);
  const steps = extractSteps($);

  return { meta, textContent, mainText, qaPairs, steps };
}

/* ───────────────────────── helpers ───────────────────────── */

function metaContent($: cheerio.CheerioAPI, name: string): string {
  return (
    $(`meta[name="${name}"]`).attr('content') ??
    $(`meta[name="${name}" i]`).attr('content') ??
    ''
  ).trim();
}

function parseJsonLd(html: string): JsonLdEntity[] {
  const out: JsonLdEntity[] = [];
  // Re-load raw html so we still see script contents (main $ has them removed).
  const $ = cheerio.load(html);
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    if (!raw.trim()) return;
    try {
      const data = JSON.parse(raw);
      collectTypes(data, out);
    } catch {
      // Some sites emit slightly malformed JSON-LD; try a lenient recovery.
      const m = raw.match(/"@type"\s*:\s*"([^"]+)"/g);
      if (m) for (const hit of m) out.push({ type: hit.replace(/.*"([^"]+)"$/, '$1') });
    }
  });
  return out;
}

function collectTypes(node: unknown, out: JsonLdEntity[]): void {
  if (!node) return;
  if (Array.isArray(node)) {
    node.forEach((n) => collectTypes(n, out));
    return;
  }
  if (typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    const t = obj['@type'];
    if (typeof t === 'string') out.push({ type: t });
    else if (Array.isArray(t)) t.forEach((x) => typeof x === 'string' && out.push({ type: x }));
    // Recurse into @graph and nested entities.
    for (const key of Object.keys(obj)) collectTypes(obj[key], out);
  }
}

function extractQAPairs($: cheerio.CheerioAPI, headings: Heading[]): { question: string; answer: string }[] {
  const pairs: { question: string; answer: string }[] = [];
  // Strategy: for each heading that is a question, take the text of following
  // siblings until the next heading as the answer.
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const q = cleanText($(el).text());
    if (!isQuestion(q)) return;
    const answerParts: string[] = [];
    let node = $(el).next();
    let guard = 0;
    while (node.length && guard < 6) {
      if (/^h[1-6]$/i.test(node[0].tagName)) break;
      const t = cleanText(node.text());
      if (t) answerParts.push(t);
      node = node.next();
      guard++;
    }
    const answer = answerParts.join(' ').trim();
    if (answer) pairs.push({ question: q, answer: truncateWords(answer, 60) });
  });
  return pairs.slice(0, 10);
}

function extractSteps($: cheerio.CheerioAPI): string[] {
  const ol = $('ol').first();
  if (!ol.length) return [];
  const steps: string[] = [];
  ol.children('li').each((_, li) => {
    const t = cleanText($(li).text());
    if (t) steps.push(truncateWords(t, 30));
  });
  return steps.slice(0, 10);
}

function checkHeadingOrder(headings: Heading[]): boolean {
  let prev = 0;
  for (const h of headings) {
    if (prev && h.level > prev + 1) return false; // skipped a level
    prev = h.level;
  }
  return true;
}

function isQuestion(text: string): boolean {
  if (!text) return false;
  if (text.trim().endsWith('?')) return true;
  return /^(how|what|why|when|where|which|who|can|do|does|is|are|should|will)\b/i.test(text.trim());
}

function cleanText(s: string): string {
  return (s || '').replace(/\s+/g, ' ').trim();
}

function truncateWords(s: string, n: number): string {
  const words = s.split(/\s+/);
  return words.length <= n ? s : `${words.slice(0, n).join(' ')}…`;
}

function safeUrl(u: string): URL | null {
  try {
    return new URL(u);
  } catch {
    return null;
  }
}

function resolve(href: string, base: URL | null): string | null {
  try {
    return new URL(href, base ?? undefined).toString();
  } catch {
    return null;
  }
}

function sameHost(a: string, base: URL): boolean {
  const ua = safeUrl(a);
  return !!ua && ua.host === base.host;
}
