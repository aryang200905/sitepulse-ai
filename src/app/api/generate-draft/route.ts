/* ── SitePulse AI — /api/generate-draft Route ──
 * Re-generates a grounded draft/blueprint for a URL on demand (e.g. a
 * "regenerate" action), independent of the original analysis payload.
 */

import { NextRequest, NextResponse } from 'next/server';
import { parsePage } from '@/services/parser';
import { runSEOAudit } from '@/services/seoAudit';
import { runAEOAudit } from '@/services/aeoAudit';
import { classifySite } from '@/services/classifier';
import { generateRecommendations } from '@/services/recommendations';
import { generateContent } from '@/services/contentGenerator';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json().catch(() => ({}));
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'A url is required.' }, { status: 400 });
    }

    const normalized = /^https?:\/\//i.test(url) ? url.trim() : `https://${url.trim()}`;

    const parsed = await parsePage(normalized);
    const seo = runSEOAudit(parsed.meta);
    const { result: aeo } = await runAEOAudit(parsed);
    const complexity = classifySite(parsed.meta);
    const recommendations = generateRecommendations(seo, aeo, parsed.meta);
    const { draft, blueprint } = generateContent({ complexity, meta: parsed.meta, recommendations, modules: aeo.modules });

    // Return the draft (simple sites) or the blueprint's sample page (complex sites).
    const data = draft ?? blueprint?.samplePage;
    if (!data) {
      return NextResponse.json({ success: false, error: 'Could not generate a draft for this page.' }, { status: 422 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Draft generation error:', err);
    const message = err instanceof Error ? err.message : 'Failed to generate draft.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
