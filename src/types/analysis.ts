/* ── SitePulse AI — Shared Analysis Types ── */

export interface SEOIssue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  fix: string;
  copyReadyExample: string;
}

export interface SEOResult {
  score: number;
  issues: SEOIssue[];
}

export interface AEOModule {
  id: string;
  type: 'definition' | 'how-to' | 'faq' | 'faq-jsonld' | 'snippets' | 'risks';
  title: string;
  content: string;
}

export interface AEOResult {
  score: number;
  modules: AEOModule[];
}

export interface Recommendation {
  rank: number;
  title: string;
  description: string;
  priority: 'Quick-Win' | 'High-Impact' | 'Medium' | 'Low-Priority';
  category: 'seo' | 'aeo';
  fix: string;
  copyReadyExample: string;
}

export interface DraftContent {
  html: string;
  markdown: string;
  preview: string;
}

export interface Blueprint {
  samplePage: DraftContent;
  rolloutPlan: string;
}

export type SiteComplexity = 'EASY' | 'COMPLEX';

export interface AnalysisResult {
  id: string;
  url: string;
  analyzedAt: string;
  complexity: SiteComplexity;
  seo: SEOResult;
  aeo: AEOResult;
  recommendations: Recommendation[];
  draft?: DraftContent;
  blueprint?: Blueprint;
}
