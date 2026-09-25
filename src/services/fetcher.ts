/* ── SitePulse AI — Resilient HTML Fetcher ──
 *
 * Fetching "any" site is the hard part: many block a plain server fetch. We use
 * a fallback chain:
 *   1. Direct fetch with realistic browser headers (fixes header-sniffing walls).
 *   2. A JS-rendering provider (Cloudflare Browser Rendering or Firecrawl),
 *      configured via env — used when the direct fetch is blocked, or always if
 *      SCRAPE_STRATEGY=render-first.
 *
 * We deliberately do NOT attempt to solve CAPTCHAs / Turnstile challenges —
 * genuinely hardened sites are reported honestly as blocked.
 */

export type FetchVia = 'direct' | 'cloudflare' | 'firecrawl';

export interface FetchResult {
  html: string;
  finalUrl: string;
  status: number;
  via: FetchVia;
}

export class BlockedError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'BlockedError';
    this.status = status;
  }
}

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Headers a real Chrome sends on a top-level navigation.
function browserHeaders(url: string): Record<string, string> {
  let origin = '';
  try {
    origin = new URL(url).origin;
  } catch {
    /* ignore */
  }
  return {
    'User-Agent': BROWSER_UA,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    ...(origin ? { Referer: origin } : {}),
  };
}

const BLOCK_STATUSES = new Set([401, 403, 406, 409, 429, 503, 520, 521, 522, 523]);

// Markers that a "200" body is really an interstitial challenge, not content.
const CHALLENGE_MARKERS = [
  'just a moment',
  'cf-browser-verification',
  'cf_chl_opt',
  '_cf_chl',
  'challenge-platform',
  'attention required',
  'checking your browser',
  'enable javascript and cookies to continue',
  'px-captcha',
  'access denied',
];

function looksLikeChallenge(html: string): boolean {
  const head = html.slice(0, 4000).toLowerCase();
  // A challenge page is short and contains a known marker.
  return html.length < 15_000 && CHALLENGE_MARKERS.some((m) => head.includes(m));
}

function providerConfigured(): FetchVia | null {
  const p = (process.env.SCRAPE_PROVIDER || '').toLowerCase();
  if (p === 'cloudflare' && process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN) return 'cloudflare';
  if (p === 'firecrawl' && process.env.FIRECRAWL_API_KEY) return 'firecrawl';
  // Auto-detect if keys are present without an explicit provider.
  if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN) return 'cloudflare';
  if (process.env.FIRECRAWL_API_KEY) return 'firecrawl';
  return null;
}

/** Fetch a page's HTML, escalating to a rendering provider when needed. */
export async function fetchHtml(url: string): Promise<FetchResult> {
  const provider = providerConfigured();
  const renderFirst = (process.env.SCRAPE_STRATEGY || '').toLowerCase() === 'render-first';

  if (provider && renderFirst) {
    const rendered = await renderWith(provider, url).catch(() => null);
    if (rendered) return rendered;
  }

  // 1) Direct attempt.
  let directErr: BlockedError | null = null;
  try {
    const res = await fetch(url, {
      headers: browserHeaders(url),
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
    });
    const ct = res.headers.get('content-type') ?? '';
    if (res.ok && /text\/html|application\/xhtml|application\/xml/i.test(ct || 'text/html')) {
      const html = await res.text();
      if (!looksLikeChallenge(html)) {
        return { html, finalUrl: res.url || url, status: res.status, via: 'direct' };
      }
      directErr = new BlockedError(403, 'Blocked by an anti-bot challenge page.');
    } else if (BLOCK_STATUSES.has(res.status)) {
      directErr = new BlockedError(res.status, `Blocked with HTTP ${res.status}.`);
    } else if (!res.ok) {
      // Non-block failure (404/5xx that isn't a bot wall) — report as-is.
      throw new BlockedError(res.status, `Failed to fetch page: ${res.status}`);
    } else {
      // OK status but non-HTML content type.
      throw new Error(`URL did not return an HTML document (content-type: ${ct}).`);
    }
  } catch (err) {
    if (err instanceof BlockedError && !BLOCK_STATUSES.has(err.status) && err.status !== 403) throw err;
    if (!(err instanceof BlockedError)) {
      // Network/timeout — try provider if we have one, else rethrow.
      if (!provider) throw err;
      directErr = new BlockedError(0, err instanceof Error ? err.message : 'fetch failed');
    } else {
      directErr = err;
    }
  }

  // 2) Provider fallback for blocked sites.
  if (provider) {
    const rendered = await renderWith(provider, url).catch((e) => {
      console.error(`${provider} render failed:`, e);
      return null;
    });
    if (rendered && rendered.html && !looksLikeChallenge(rendered.html)) return rendered;
  }

  // 3) Give up — honest block.
  throw directErr ?? new BlockedError(403, 'This site blocked automated access.');
}

async function renderWith(provider: FetchVia, url: string): Promise<FetchResult | null> {
  if (provider === 'cloudflare') return renderCloudflare(url);
  if (provider === 'firecrawl') return renderFirecrawl(url);
  return null;
}

/** Cloudflare Browser Rendering — headless Chrome on Cloudflare's edge. */
async function renderCloudflare(url: string): Promise<FetchResult | null> {
  const acct = process.env.CLOUDFLARE_ACCOUNT_ID!;
  const token = process.env.CLOUDFLARE_API_TOKEN!;
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${acct}/browser-rendering/content`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      url,
      gotoOptions: { waitUntil: 'networkidle0', timeout: 25_000 },
    }),
    signal: AbortSignal.timeout(40_000),
  });

  if (!res.ok) {
    throw new Error(`Cloudflare Browser Rendering HTTP ${res.status}`);
  }
  const data = await res.json();
  const html: string | undefined = data?.result ?? (typeof data === 'string' ? data : undefined);
  if (!data?.success || !html) return null;
  return { html, finalUrl: url, status: 200, via: 'cloudflare' };
}

/** Firecrawl — managed scraping with browser emulation + proxies. */
async function renderFirecrawl(url: string): Promise<FetchResult | null> {
  const key = process.env.FIRECRAWL_API_KEY!;
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ url, formats: ['rawHtml'], onlyMainContent: false, timeout: 30_000 }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Firecrawl HTTP ${res.status}`);
  const data = await res.json();
  const html: string | undefined = data?.data?.rawHtml ?? data?.data?.html;
  if (!data?.success || !html) return null;
  const finalUrl: string = data?.data?.metadata?.sourceURL ?? url;
  return { html, finalUrl, status: data?.data?.metadata?.statusCode ?? 200, via: 'firecrawl' };
}
