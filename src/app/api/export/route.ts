/* ── SitePulse AI — /api/export Route ── */

import { NextRequest, NextResponse } from 'next/server';
import { generateHTMLReport } from '@/services/exportService';
import type { AnalysisResult } from '@/types/analysis';

export async function POST(req: NextRequest) {
  try {
    const { analysisJson } = await req.json();

    if (!analysisJson) {
      return NextResponse.json({ success: false, error: 'analysisJson is required.' }, { status: 400 });
    }

    const result: AnalysisResult = JSON.parse(analysisJson);
    const html = generateHTMLReport(result);

    return NextResponse.json({ success: true, html });
  } catch (err) {
    console.error('Export error:', err);
    return NextResponse.json({ success: false, error: 'Failed to generate report.' }, { status: 500 });
  }
}
