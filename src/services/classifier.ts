/* ── SitePulse AI — Site Complexity Classifier ── */

import type { SiteComplexity } from '@/types/analysis';
import type { PageMeta } from '@/config/scoring';

/**
 * Classify a site as EASY or COMPLEX based on page structure.
 * EASY = simple single-purpose page (landing, blog, portfolio)
 * COMPLEX = multi-section site with dynamic content, many links, etc.
 */
export function classifySite(meta: PageMeta): SiteComplexity {
  let complexityScore = 0;

  // More external links = more complex
  if (meta.externalLinks > 20) complexityScore += 2;
  else if (meta.externalLinks > 10) complexityScore += 1;

  // More internal links = more complex
  if (meta.internalLinks > 30) complexityScore += 2;
  else if (meta.internalLinks > 15) complexityScore += 1;

  // Many headings = deep content structure
  if (meta.h2Count > 8) complexityScore += 2;
  else if (meta.h2Count > 4) complexityScore += 1;

  // Very long content
  if (meta.wordCount > 2000) complexityScore += 2;
  else if (meta.wordCount > 1000) complexityScore += 1;

  // Multiple images
  if (meta.imgCount > 10) complexityScore += 1;

  // Structured data present = more sophisticated site
  if (meta.hasStructuredData) complexityScore += 1;

  return complexityScore >= 5 ? 'COMPLEX' : 'EASY';
}
