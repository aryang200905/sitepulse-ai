/* ── SitePulse AI — API Request / Response Types ── */

import type { AnalysisResult, DraftContent } from './analysis';

/* /api/analyze */
export interface AnalyzeRequest {
  url: string;
}

export interface AnalyzeResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
}

/* /api/generate-draft */
export interface GenerateDraftRequest {
  analysisId: string;
  url: string;
}

export interface GenerateDraftResponse {
  success: boolean;
  data?: DraftContent;
  error?: string;
}

/* /api/export */
export interface ExportRequest {
  analysisJson: string;
}

export interface ExportResponse {
  success: boolean;
  html?: string;
  error?: string;
}
