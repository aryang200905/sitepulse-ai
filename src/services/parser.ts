/* ── SitePulse AI — URL Parser & Content Extraction ── */

import type { PageMeta } from '@/config/scoring';

/**
 * Fetch a URL and extract page metadata for scoring.
 * In production this would use a headless browser; for now we parse raw HTML.
 */
export async function parsePage(url: string): Promise<{ meta: PageMeta; rawHtml: string; textContent: string }> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SitePulseAI/1.0 (+https://sitepulse.ai)' },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const html = await res.text();

  const meta = extractMeta(html, url);
  const textContent = extractText(html);

  return { meta, rawHtml: html, textContent };
}

function extractMeta(html: string, url: string): PageMeta {
  const match = (pattern: RegExp): string => {
    const m = html.match(pattern);
    return m ? m[1] ?? '' : '';
  };

  const title = match(/<title[^>]*>([^<]*)<\/title>/i);
  const description = match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
    || match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i);

  const h1Matches = html.match(/<h1[^>]*>/gi) ?? [];
  const h1Text = match(/<h1[^>]*>([^<]*)<\/h1>/i);
  const h2Matches = html.match(/<h2[^>]*>/gi) ?? [];

  const imgMatches = html.match(/<img[^>]*>/gi) ?? [];
  const imgsWithAlt = imgMatches.filter((tag) => /alt=["'][^"']+["']/i.test(tag)).length;

  const textContent = extractText(html);
  const wordCount = textContent.split(/\s+/).filter(Boolean).length;

  const hasCanonical = /<link[^>]*rel=["']canonical["']/i.test(html);
  const hasRobotsMeta = /<meta[^>]*name=["']robots["']/i.test(html);
  const hasStructuredData = /application\/ld\+json/i.test(html);
  const hasOpenGraph = /<meta[^>]*property=["']og:/i.test(html);
  const hasFAQSchema = /FAQPage/i.test(html);
  const hasHowToSchema = /HowTo/i.test(html) && hasStructuredData;

  const internalLinks = (html.match(/href=["']\/[^"']*/gi) ?? []).length;
  const externalLinks = (html.match(/href=["']https?:\/\/[^"']*/gi) ?? []).length;

  return {
    title,
    titleLength: title.length,
    description,
    descriptionLength: description.length,
    h1Count: h1Matches.length,
    h1Text,
    h2Count: h2Matches.length,
    imgCount: imgMatches.length,
    imgsWithAlt,
    wordCount,
    hasCanonical,
    hasRobotsMeta,
    hasStructuredData,
    hasOpenGraph,
    hasFAQSchema,
    hasHowToSchema,
    internalLinks,
    externalLinks,
    url,
    loadTimeMs: 0,
  };
}

function extractText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
