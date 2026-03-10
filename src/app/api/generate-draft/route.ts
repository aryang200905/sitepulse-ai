/* ── SitePulse AI — /api/generate-draft Route ── */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { analysisId, url } = await req.json();

    if (!analysisId || !url) {
      return NextResponse.json({ success: false, error: 'analysisId and url are required.' }, { status: 400 });
    }

    // In a full implementation, this would re-run the content generator with LLM enhancement.
    // For now, return a placeholder indicating the draft was already generated during analysis.
    return NextResponse.json({
      success: true,
      data: {
        html: '<p>Draft generation is included in the analysis pipeline. View the Draft/Blueprint tab in your results.</p>',
        markdown: 'Draft generation is included in the analysis pipeline.',
        preview: '<p>Draft generation is included in the analysis pipeline.</p>',
      },
    });
  } catch (err) {
    console.error('Draft generation error:', err);
    return NextResponse.json({ success: false, error: 'Failed to generate draft.' }, { status: 500 });
  }
}
