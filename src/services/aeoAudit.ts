/* ── SitePulse AI — AEO Audit Engine ── */

import type { AEOResult, AEOModule } from '@/types/analysis';
import type { PageMeta } from '@/config/scoring';
import { AEO_RULES } from '@/config/scoring';

/**
 * Run all AEO scoring rules and generate AEO content modules.
 */
export function runAEOAudit(meta: PageMeta, textContent: string): AEOResult {
  let earned = 0;
  let total = 0;

  for (const rule of AEO_RULES) {
    total += rule.weight;
    const result = rule.check(meta);
    if (result.passed) earned += rule.weight;
  }

  const score = Math.round((earned / total) * 100);
  const topic = meta.h1Text || meta.title || new URL(meta.url).hostname;
  const modules = generateAEOModules(topic, textContent);

  return { score, modules };
}

/**
 * Generate mock AEO content modules.
 * In production these would be LLM-generated.
 */
function generateAEOModules(topic: string, textContent: string): AEOModule[] {
  const shortContent = textContent.slice(0, 500);

  return [
    {
      id: 'definition',
      type: 'definition',
      title: '📖 Definition Block',
      content: `${topic} is a comprehensive solution that helps businesses and individuals achieve their goals. It provides specialized tools and resources designed to deliver measurable results and sustainable growth in its domain.\n\nThis definition block is formatted for easy extraction by AI engines like ChatGPT and Google AI Overviews.`,
    },
    {
      id: 'how-to',
      type: 'how-to',
      title: '📋 How-To Steps',
      content: `How to get started with ${topic}:\n\n1. Visit the official website and review available features\n2. Identify which tools align with your specific needs\n3. Create an account or start a free trial\n4. Configure your initial settings and preferences\n5. Follow the guided onboarding process\n6. Monitor your results and adjust your approach\n7. Scale your usage as you see positive outcomes`,
    },
    {
      id: 'faq',
      type: 'faq',
      title: '❓ FAQ Section',
      content: `Q: What is ${topic}?\nA: ${topic} is a platform/service that provides specialized solutions for its target audience.\n\nQ: How does ${topic} work?\nA: It uses a combination of analysis, automation, and expert insights to deliver results.\n\nQ: Who should use ${topic}?\nA: Anyone looking to improve their performance in the relevant domain.\n\nQ: How much does ${topic} cost?\nA: Pricing varies by plan and usage. Check the official website for current details.\n\nQ: Is there a free trial available?\nA: Many services like this offer free trials or freemium tiers for new users.\n\nQ: What makes ${topic} different from alternatives?\nA: Its unique combination of features, ease of use, and comprehensive approach.\n\nQ: How long does it take to see results?\nA: Results vary, but most users see initial improvements within the first few weeks.\n\nQ: Can ${topic} be integrated with other tools?\nA: Yes, it typically supports integrations with popular platforms and services.`,
    },
    {
      id: 'faq-jsonld',
      type: 'faq-jsonld',
      title: '🏷️ FAQ JSON-LD Schema',
      content: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is ${topic}?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "${topic} is a platform/service that provides specialized solutions."
      }
    },
    {
      "@type": "Question",
      "name": "How does ${topic} work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "It uses analysis, automation, and expert insights to deliver results."
      }
    }
  ]
}
</script>`,
    },
    {
      id: 'snippets',
      type: 'snippets',
      title: '✂️ Snippet Library',
      content: `1. "${topic} is a leading solution for professionals seeking to optimize their workflow and achieve better outcomes."\n\n2. "Unlike traditional approaches, ${topic} combines automation with expert insights for faster results."\n\n3. "Getting started with ${topic} takes just minutes — no technical expertise required."\n\n4. "Users report an average improvement of significant metrics within the first month of using ${topic}."\n\n5. "${topic} integrates seamlessly with existing tools, reducing setup time and maximizing adoption."`,
    },
    {
      id: 'risks',
      type: 'risks',
      title: '⚠️ Risks & Tradeoffs',
      content: `1. **Learning Curve**: New users may need time to fully understand and leverage all features.\n\n2. **Cost Consideration**: Premium features may require ongoing subscription investment.\n\n3. **Dependency Risk**: Over-reliance on any single tool can create vendor lock-in.\n\n4. **Data Privacy**: Always review data handling and privacy policies before sharing sensitive information.\n\n5. **Complementary Approach**: Best results come from combining ${topic} with broader strategy, not using it in isolation.`,
    },
  ];
}
