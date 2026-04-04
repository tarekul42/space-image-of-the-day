/**
 * background.ts - Extension Background Script (Chrome + Firefox)
 * Coordinates fetching, enrichment, and caching.
 *
 * Uses the webextension-polyfill (via ./browser) so that browser.* APIs
 * work identically on both Chrome (MV3 service worker) and Firefox (MV3
 * background script). No chrome.* calls appear here directly.
 */

import browser from './browser';
import { fetchApod, fetchRandomApod } from './services/apod.service';
import { enrichData } from './utils/enrichment';
import { saveImageBlob, clearOldImages } from './utils/storage';

// ─── Resolution Threshold ────────────────────────────────────
const MIN_WIDTH = 1000;
const MIN_HEIGHT = 700;

/**
 * Probe the pixel dimensions of an image URL and return the Blob.
 */
async function getImageData(url: string): Promise<{ width: number; height: number; blob: Blob } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const dims = { width: bitmap.width, height: bitmap.height, blob };
    bitmap.close();
    return dims;
  } catch {
    return null;
  }
}

// ─── Message Handling & Caching ──────────────────────────────

browser.runtime.onMessage.addListener(
  (
    request: unknown,
    _sender: browser.Runtime.MessageSender,
  ) => {
    const req = request as { type: string; date?: string; lang?: string; allowLowRes?: boolean };

    if (req.type === 'FETCH_APOD' || req.type === 'UPDATE_TRANSLATION') {
      return handleFetchApod(req.date, req.lang);
    }
    if (req.type === 'FETCH_RANDOM') {
      return handleFetchRandom(req.lang, req.allowLowRes);
    }
    if (req.type === 'CLEAR_BUFFER') {
      return handleClearBuffer(req.lang, req.allowLowRes);
    }
  },
);

async function handleFetchApod(date?: string, lang?: string) {
  try {
    const rawData = await fetchApod(date, lang);
    const data = rawData.url ? await getImageData(rawData.hdurl || rawData.url) : null;
    const enriched = await enrichData({
      ...rawData,
      width: data?.width,
      height: data?.height,
    });

    if (data?.blob) {
      await saveImageBlob(rawData.date, data.blob);
    }

    // Cache it
    const today = date || new Date().toISOString().split('T')[0];
    await browser.storage.local.set({ [today]: enriched });
    return { data: enriched, fromCache: false };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Fallback to latest cached entry on any error
    const allCache = await browser.storage.local.get(null);
    const keys = Object.keys(allCache)
      .filter((k) => k !== 'random_buffer')
      .sort()
      .reverse();
    if (keys.length > 0) {
      return { data: allCache[keys[0]], fromCache: true, offline: true };
    }
    return { error: errorMessage };
  }
}

const BUFFER_LIMIT = 3;
const BUFFER_KEY = 'random_buffer';
let isRefilling = false;

async function handleClearBuffer(lang?: string, allowLowRes?: boolean) {
  await browser.storage.local.set({ [BUFFER_KEY]: [] });
  refillBufferIfNeeded(0, lang, allowLowRes);
  return { data: { success: true } };
}

async function handleFetchRandom(lang?: string, allowLowRes?: boolean) {
  try {
    const result = await browser.storage.local.get(BUFFER_KEY);
    const buffer: unknown[] = Array.isArray(result[BUFFER_KEY]) ? result[BUFFER_KEY] : [];

    if (buffer.length > 0) {
      const dataToReturn = buffer.shift();
      await browser.storage.local.set({ [BUFFER_KEY]: buffer });
      refillBufferIfNeeded(buffer.length, lang, allowLowRes);
      return { data: dataToReturn };
    } else {
      // Fetch live and apply resolution check if needed
      const enriched = await fetchAndValidateRandomApod(lang, allowLowRes);
      refillBufferIfNeeded(0, lang, allowLowRes);
      return { data: enriched };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const allCache = await browser.storage.local.get(null);
    const keys = Object.keys(allCache)
      .filter((k) => k !== BUFFER_KEY)
      .sort()
      .reverse();
    if (keys.length > 0) {
      return { data: allCache[keys[0]], fromCache: true, offline: true };
    }
    return { error: errorMessage };
  }
}

/**
 * Fetch a random APOD and verify its resolution.
 * Retries until a qualifying image is found (up to 10 attempts).
 */
async function fetchAndValidateRandomApod(lang?: string, allowLowRes?: boolean) {
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    console.log(`[buffer] Attempt ${attempt + 1}: Fetching random discovery...`);
    const rawData = await fetchRandomApod(lang);
    
    if (rawData.media_type !== 'image') {
      console.log(`[buffer] Skipping ${rawData.media_type}: ${rawData.title}`);
      continue;
    }

    const data = rawData.url ? await getImageData(rawData.hdurl || rawData.url) : null;
    if (!data) {
      console.log(`[buffer] Failed to probe image: ${rawData.title}`);
      continue;
    }

    const isHighRes = data.width >= MIN_WIDTH && data.height >= MIN_HEIGHT;

    if (allowLowRes || isHighRes) {
      if (data.blob) {
        await saveImageBlob(rawData.date, data.blob);
      }
      const enriched = await enrichData({
        ...rawData,
        width: data.width,
        height: data.height,
      });
      console.log(`[buffer] Accepted ${isHighRes ? 'high-res' : 'low-res'} image: ${rawData.title}`);
      return enriched;
    }

    console.log(`[buffer] Skipping low-res image (${data.width}x${data.height}): ${rawData.title}`);
  }

  // Exhausted attempts — fall back to whatever the last fetch was, or get one more
  console.log(`[buffer] Exhausted attempts, falling back...`);
  const rawData = await fetchRandomApod(lang);
  const data = rawData.url ? await getImageData(rawData.hdurl || rawData.url) : null;
  if (data?.blob) {
    await saveImageBlob(rawData.date, data.blob);
  }
  return enrichData({ ...rawData, width: data?.width, height: data?.height });
}

async function refillBufferIfNeeded(currentLength: number, lang?: string, allowLowRes?: boolean) {
  if (isRefilling || currentLength >= BUFFER_LIMIT) return;
  isRefilling = true;
  try {
    const needed = BUFFER_LIMIT - currentLength;
    for (let i = 0; i < needed; i++) {
      const enriched = await fetchAndValidateRandomApod(lang, allowLowRes);
      const result = await browser.storage.local.get(BUFFER_KEY);
      const currentBuffer: unknown[] = Array.isArray(result[BUFFER_KEY]) ? result[BUFFER_KEY] : [];
      currentBuffer.push(enriched);
      await browser.storage.local.set({ [BUFFER_KEY]: currentBuffer });
    }

    // Cleanup: Keep only blobs that are in the buffer or are the today's image
    const result = await browser.storage.local.get(null);
    const bufferedDates = ((result[BUFFER_KEY] as any[]) || []).map((item: any) => item.date);
    const today = new Date().toISOString().split('T')[0];
    const cachedDates = Object.keys(result).filter((k) => k !== BUFFER_KEY);
    await clearOldImages([...bufferedDates, ...cachedDates, today]);
  } catch (err) {
    console.error('Failed to refill random buffer', err);
  } finally {
    isRefilling = false;
  }
}

// ─── Lifecycle & Pre-fetching ────────────────────────────────

browser.runtime.onInstalled.addListener(async () => {
  // Prime the buffer on first install
  const result = await browser.storage.local.get(BUFFER_KEY);
  const buffer: unknown[] = Array.isArray(result[BUFFER_KEY]) ? result[BUFFER_KEY] : [];
  refillBufferIfNeeded(buffer.length);
});

browser.runtime.onStartup.addListener(async () => {
  // Ensure buffer is full when the browser starts
  const result = await browser.storage.local.get(BUFFER_KEY);
  const buffer: unknown[] = Array.isArray(result[BUFFER_KEY]) ? result[BUFFER_KEY] : [];
  refillBufferIfNeeded(buffer.length);
});
