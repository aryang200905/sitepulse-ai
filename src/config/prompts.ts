/* ── SitePulse AI — LLM Prompt Templates ── */

export const PROMPTS = {
  seoEnhance: `You are an expert SEO consultant. Given the following page analysis data, provide additional insights and copy-ready fixes.
Return JSON: { "additionalIssues": [{ "id": string, "title": string, "description": string, "severity": "critical"|"warning"|"info", "fix": string, "copyReadyExample": string }] }

Page data:
{{pageData}}`,

  aeoDefinition: `You are an AI-readiness content expert. Write a concise, quotable definition block (2-3 sentences) for a page about: "{{topic}}".
The definition should be easily extractable by AI engines like ChatGPT and Google AI Overviews.
Return plain text only.`,

  aeoHowTo: `Write a clear, numbered how-to guide (5-8 steps) for: "{{topic}}".
Each step should be one concise sentence.
Return plain text with numbered steps.`,

  aeoFAQ: `Generate 8-12 frequently asked questions and concise answers about: "{{topic}}".
Format: Q: [question]\\nA: [answer]\\n\\n
Return plain text.`,

  aeoFAQJsonLD: `Generate FAQ JSON-LD schema markup for the following Q&A pairs:

{{faqContent}}

Return valid JSON-LD only.`,

  aeoSnippets: `Write 5-7 short, quotable answer snippets (1-2 sentences each) about: "{{topic}}".
These should be concise enough for AI engines to directly cite.
Return as a numbered list.`,

  aeoRisks: `List 4-6 risks, tradeoffs, or common misconceptions about: "{{topic}}".
Provide balanced, factual content.
Return as a numbered list.`,

  draftEasy: `You are a web content expert. Rewrite the following page content with all SEO and AEO best practices applied.
Include: proper headings, meta descriptions, FAQ schema suggestions, definition blocks, and internal linking suggestions.

Original content summary: {{contentSummary}}
Top issues to fix: {{issues}}

Return the improved content in Markdown format.`,

  blueprintComplex: `Create a content improvement blueprint for a complex website page about: "{{topic}}".
Include:
1. A sample improved page (in Markdown)
2. A rollout plan (phases with priorities)

Content summary: {{contentSummary}}
Key issues: {{issues}}

Return in format:
## Sample Page
[markdown content]

## Rollout Plan
[phased plan]`,
} as const;
