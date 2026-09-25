/* ── SitePulse AI — LLM Orchestrator (optional, provider-agnostic) ── */

/**
 * Thin wrapper over an OpenAI-compatible OR Anthropic chat endpoint.
 *
 * Configured entirely through env (see .env.example):
 *   LLM_API_KEY   — required to enable AI enhancement (falls back gracefully if absent)
 *   LLM_API_URL   — chat completions endpoint (defaults to OpenAI)
 *   LLM_MODEL     — model id (defaults to gpt-4o-mini)
 *
 * When no key is present, every call returns null and the deterministic engine
 * takes over — so the product always works, it just gets sharper with a key.
 */
export class LLMOrchestrator {
  private apiKey: string;
  private apiUrl: string;
  private model: string;
  private isAnthropic: boolean;

  constructor() {
    // Accept a few common key names so existing deployments "just work".
    this.apiKey =
      process.env.LLM_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      '';
    this.apiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';
    this.model = process.env.LLM_MODEL || 'gpt-4o-mini';
    this.isAnthropic = /anthropic\.com/i.test(this.apiUrl) || !!process.env.ANTHROPIC_API_KEY;
  }

  get isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Send a system + user prompt and return the raw text response, or null on
   * any failure (missing key, network error, bad status). Never throws.
   */
  async complete(system: string, user: string, opts?: { maxTokens?: number; temperature?: number }): Promise<string | null> {
    if (!this.isAvailable) return null;
    const maxTokens = opts?.maxTokens ?? 1200;
    const temperature = opts?.temperature ?? 0.4;

    try {
      const res = this.isAnthropic
        ? await this.callAnthropic(system, user, maxTokens, temperature)
        : await this.callOpenAI(system, user, maxTokens, temperature);
      return res;
    } catch (err) {
      console.error('LLM call failed:', err);
      return null;
    }
  }

  /** Ask for JSON and parse it defensively (handles ```json fences and stray prose). */
  async completeJSON<T>(system: string, user: string, opts?: { maxTokens?: number }): Promise<T | null> {
    const text = await this.complete(
      `${system}\nRespond with valid JSON only — no markdown, no commentary.`,
      user,
      { maxTokens: opts?.maxTokens ?? 1500, temperature: 0.3 },
    );
    if (!text) return null;
    return extractJSON<T>(text);
  }

  private async callOpenAI(system: string, user: string, maxTokens: number, temperature: number): Promise<string | null> {
    const res = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      console.error('LLM API error:', res.status, await safeBody(res));
      return null;
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  }

  private async callAnthropic(system: string, user: string, maxTokens: number, temperature: number): Promise<string | null> {
    const res = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        system,
        messages: [{ role: 'user', content: user }],
        temperature,
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      console.error('LLM API error:', res.status, await safeBody(res));
      return null;
    }
    const data = await res.json();
    return data.content?.[0]?.text ?? null;
  }
}

function extractJSON<T>(text: string): T | null {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  // Grab the outermost JSON object/array.
  const start = cleaned.search(/[[{]/);
  if (start === -1) return null;
  const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  if (end === -1 || end < start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

async function safeBody(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 300);
  } catch {
    return '';
  }
}

/** Shared singleton — cheap to construct, but avoids re-reading env per call. */
export const llm = new LLMOrchestrator();
