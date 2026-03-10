/* ── SitePulse AI — LLM Orchestrator ── */

import { PROMPTS } from '@/config/prompts';

/**
 * Orchestrate LLM calls for AI-enhanced analysis.
 * Falls back to rule-based results when no API key is configured.
 */
export class LLMOrchestrator {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
  }

  get isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /**
   * Call the LLM with a prompt. Returns null if no API key is configured.
   */
  async call(promptKey: keyof typeof PROMPTS, variables: Record<string, string>): Promise<string | null> {
    if (!this.isAvailable) return null;

    let prompt = PROMPTS[promptKey] as string;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(`{{${key}}}`, value);
    }

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!res.ok) {
        console.error('LLM API error:', res.status);
        return null;
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? null;
    } catch (err) {
      console.error('LLM call failed:', err);
      return null;
    }
  }
}
