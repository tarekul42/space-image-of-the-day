/**
 * background.ts - Chrome Extension Service Worker
 * Handles NASA APOD fetching, SIMBAD enrichment, and local caching.
 */

const NASA_APOD_URL = 'https://api.nasa.gov/planetary/apod';
const SIMBAD_URL = 'https://simbad.cds.unistra.fr/simbad/sim-id';

interface ApodData {
  date: string;
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: string;
  copyright?: string;
  object_type?: string;
  constellation?: string;
  more_info_url?: string;
}

// ─── NASA API Logic ──────────────────────────────────────────

async function fetchApod(apiKey: string = 'DEMO_KEY', date?: string): Promise<ApodData> {
  const params = new URLSearchParams({ api_key: apiKey });
  if (date) params.append('date', date);

  const response = await fetch(`${NASA_APOD_URL}?${params.toString()}`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NASA API error (${response.status}): ${errorText}`);
  }
  return await response.json();
}

async function fetchRandomApod(apiKey: string = 'DEMO_KEY'): Promise<ApodData> {
  const params = new URLSearchParams({ api_key: apiKey, count: '1' });
  const response = await fetch(`${NASA_APOD_URL}?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch random discovery');
  const data = await response.json();
  return Array.isArray(data) ? data[0] : data;
}

function extractObjectName(title: string): string {
  const name = title
    .replace(/^APOD:\s*/i, '')
    .replace(/^Image of the Day:\s*/i, '')
    .replace(/^\d{4}\s+/i, '')
    .replace(/\s*\[.*?\]\s*/g, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/\s*by\s+.*$/i, '')
    .trim();

  const parts = name.split(/[\s:,\-–—]+/).filter(Boolean);
  return parts.length >= 2 ? parts.slice(0, 3).join(' ') : name;
}

// ─── SIMBAD & Enrichment Logic ────────────────────────────────

async function querySimbad(
  objectName: string,
): Promise<{ objectType: string; more_info_url: string } | null> {
  if (!objectName || objectName.trim().length < 2) return null;

  try {
    const params = new URLSearchParams({ Ident: objectName });
    const url = `${SIMBAD_URL}?${params.toString()}&NbIdent=1&VOTableExport=on`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const text = await response.text();

    let objectType = 'Celestial Object';
    const otypeDataMatch = text.match(
      /<TD>(G|PN|HII|Cl|Neb|Gal|GCl|QSO|Sy\d?|Blazar|C_star|Star|SNR)[\w.*]*/i,
    );
    if (otypeDataMatch) {
      const typeMap: Record<string, string> = {
        G: 'Galaxy',
        PN: 'Planetary Nebula',
        HII: 'HII Region',
        Cl: 'Star Cluster',
        Neb: 'Nebula',
        Gal: 'Galaxy',
        GCl: 'Globular Cluster',
        QSO: 'Quasar',
        SNR: 'Supernova Remnant',
        STAR: 'Star',
      };
      objectType = typeMap[otypeDataMatch[1].toUpperCase()] || otypeDataMatch[1];
    }

    return { objectType, more_info_url: url };
  } catch {
    return null;
  }
}

function inferFromExplanation(title: string, explanation: string) {
  const combined = `${title} ${explanation}`.toLowerCase();
  const types = [
    { kw: ['galaxy', 'spiral', 'elliptical'], type: 'Galaxy' },
    { kw: ['nebula', 'planetary nebula'], type: 'Nebula' },
    { kw: ['supernova', 'remnant'], type: 'Supernova Remnant' },
    { kw: ['star cluster', 'globular'], type: 'Star Cluster' },
    { kw: ['planet', 'jupiter', 'mars', 'saturn'], type: 'Planet' },
  ];

  let objectType = 'Celestial Object';
  for (const { kw, type } of types) {
    if (kw.some((k) => combined.includes(k))) {
      objectType = type;
      break;
    }
  }

  return { objectType };
}

async function enrichData(nasaData: ApodData): Promise<ApodData> {
  const objectName = extractObjectName(nasaData.title);
  const simbad = await querySimbad(objectName);
  const inferred = inferFromExplanation(nasaData.title, nasaData.explanation);

  return {
    ...nasaData,
    object_type: simbad?.objectType || inferred.objectType,
    more_info_url:
      simbad?.more_info_url ||
      `https://en.wikipedia.org/wiki/${encodeURIComponent(nasaData.title.replace(/\s+/g, '_'))}`,
  };
}

// ─── Message Handling & Caching ──────────────────────────────

chrome.runtime.onMessage.addListener(
  (
    request: { type: string; date?: string },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: {
      data?: unknown;
      fromCache?: boolean;
      offline?: boolean;
      error?: string;
    }) => void,
  ) => {
    if (request.type === 'FETCH_APOD') {
      handleFetchApod(request.date).then(sendResponse);
      return true; // Keep channel open for async
    }
    if (request.type === 'FETCH_RANDOM') {
      handleFetchRandom().then(sendResponse);
      return true;
    }
  },
);

async function handleFetchApod(date?: string) {
  try {
    const result = await chrome.storage.sync.get('settings');
    const settings = result.settings as { nasaApiKey?: string } | undefined;
    const apiKey = settings?.nasaApiKey || 'DEMO_KEY';

    // Check cache for today
    const today = date || new Date().toISOString().split('T')[0];
    const cached = await chrome.storage.local.get(today);
    if (cached[today]) return { data: cached[today], fromCache: true };

    const rawData = await fetchApod(apiKey, date);
    const enriched = await enrichData(rawData);

    // Cache it
    await chrome.storage.local.set({ [today]: enriched });
    return { data: enriched, fromCache: false };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Fallback to latest cached if any error
    const allCache = await chrome.storage.local.get(null);
    const keys = Object.keys(allCache).sort().reverse();
    if (keys.length > 0) {
      return { data: allCache[keys[0]], fromCache: true, offline: true };
    }
    return { error: errorMessage };
  }
}

async function handleFetchRandom() {
  try {
    const result = await chrome.storage.sync.get('settings');
    const settings = result.settings as { nasaApiKey?: string } | undefined;
    const apiKey = settings?.nasaApiKey || 'DEMO_KEY';
    const rawData = await fetchRandomApod(apiKey);
    const enriched = await enrichData(rawData);
    return { data: enriched };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { error: errorMessage };
  }
}
