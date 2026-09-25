/* ── SitePulse AI — /api/analyze Route ── */

import { NextRequest, NextResponse } from 'next/server';
import { parsePage } from '@/services/parser';
import { runSEOAudit } from '@/services/seoAudit';
import { runAEOAudit } from '@/services/aeoAudit';
import { classifySite } from '@/services/classifier';
import { generateRecommendations } from '@/services/recommendations';
import { generateContent } from '@/services/contentGenerator';
import type { AnalysisResult, PageSignals } from '@/types/analysis';

// Parsing + optional LLM calls need the Node runtime and a little headroom.
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = body?.url;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'A URL is required.' }, { status: 400 });
    }

    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) {
      return NextResponse.json({ success: false, error: 'That doesn’t look like a valid URL.' }, { status: 400 });
    }

    // 1. Fetch + parse the real page.
    const parsed = await parsePage(normalizedUrl);
    const { meta } = parsed;

    // 2. Audits (SEO deterministic; AEO deterministic score + grounded content).
    const seo = runSEOAudit(meta);
    const { result: aeo, aiEnhanced } = await runAEOAudit(parsed);

    // 3. Classify + prioritise.
    const complexity = classifySite(meta);
    const recommendations = generateRecommendations(seo, aeo, meta);

    // 4. Draft / blueprint grounded in the real content.
    const { draft, blueprint } = generateContent({ complexity, meta, recommendations, modules: aeo.modules });

    const signals: PageSignals = {
      finalUrl: meta.finalUrl,
      httpStatus: meta.httpStatus,
      loadTimeMs: meta.loadTimeMs,
      htmlKb: Math.round(meta.htmlBytes / 1024),
      wordCount: meta.wordCount,
      title: meta.title,
      description: meta.description,
      h1Count: meta.h1Count,
      h2Count: meta.h2Count,
      imgCount: meta.imgCount,
      imgsMissingAlt: meta.imgsMissingAlt,
      internalLinks: meta.internalLinks,
      externalLinks: meta.externalLinks,
      schemaTypes: meta.schemaTypes,
      lang: meta.lang,
    };

    const result: AnalysisResult = {
      id: crypto.randomUUID(),
      url: normalizedUrl,
      analyzedAt: new Date().toISOString(),
      complexity,
      aiEnhanced,
      signals,
      seo,
      aeo,
      recommendations,
      draft,
      blueprint,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error('Analysis error:', err);
    const message = err instanceof Error ? err.message : 'Analysis failed.';

    // Distinguish common failure modes for a helpful UI message.
    const isAntiBot = /: (401|403|406|429|503|520|521|522|523)$/.test(message) || /forbidden|access denied|blocked/i.test(message);
    const isTimeout = /timed out|timeout|aborted/i.test(message);
    const isDns = /ENOTFOUND|getaddrinfo|fetch failed/i.test(message);

    const friendly = isAntiBot
      ? 'This site is blocking automated requests (likely Cloudflare or an enterprise WAF). Try a different page, or one without bot protection.'
      : isTimeout
        ? 'The site took too long to respond. It may be slow or temporarily down.'
        : isDns
          ? 'Couldn’t reach that URL. Double-check the domain is correct and publicly reachable.'
          : message;

    return NextResponse.json(
      { success: false, error: friendly, ...(isAntiBot && { errorType: 'anti-bot' }) },
      { status: isAntiBot ? 502 : 500 },
    );
  }
}

function normalizeUrl(input: string): string | null {
  let u = input.trim();
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    const parsed = new URL(u);
    if (!parsed.hostname.includes('.')) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}
