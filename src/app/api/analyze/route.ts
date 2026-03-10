/* ── SitePulse AI — /api/analyze Route ── */

import { NextRequest, NextResponse } from 'next/server';
import { parsePage } from '@/services/parser';
import { runSEOAudit } from '@/services/seoAudit';
import { runAEOAudit } from '@/services/aeoAudit';
import { classifySite } from '@/services/classifier';
import { generateRecommendations } from '@/services/recommendations';
import { generateContent } from '@/services/contentGenerator';
import type { AnalysisResult } from '@/types/analysis';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'URL is required.' }, { status: 400 });
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // 1. Parse the page
    const { meta, textContent } = await parsePage(normalizedUrl);

    // 2. Run audits
    const seo = runSEOAudit(meta);
    const aeo = runAEOAudit(meta, textContent);

    // 3. Classify complexity
    const complexity = classifySite(meta);

    // 4. Generate recommendations
    const recommendations = generateRecommendations(seo, aeo);

    // 5. Generate content (draft or blueprint)
    const topic = meta.h1Text || meta.title || normalizedUrl;
    const { draft, blueprint } = generateContent(complexity, topic, recommendations, textContent);

    const result: AnalysisResult = {
      id: crypto.randomUUID(),
      url: normalizedUrl,
      analyzedAt: new Date().toISOString(),
      complexity,
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
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
