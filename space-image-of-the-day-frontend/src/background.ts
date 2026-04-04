/**
 * background.ts - Chrome Extension Service Worker
 * Coordinates fetching, enrichment, and caching.
 */

import { fetchApod, fetchRandomApod } from './services/apod.service';
import { enrichData } from './utils/enrichment';

// ─── Resolution Threshold ────────────────────────────────────
const MIN_WIDTH = 1000;
const MIN_HEIGHT = 700;

/**
 * Probe the pixel dimensions of an image URL without loading the full DOM.
 * Uses createImageBitmap which is available in service workers.
 */
async function getImageDimensions(url: string): Promise<{ width: number; height: number } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const dims = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dims;
  } catch {
    return null;
  }
}

// ─── Message Handling & Caching ──────────────────────────────

chrome.runtime.onMessage.addListener(
  (
    request: { type: string; date?: string; lang?: string; allowLowRes?: boolean },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: {
      data?: unknown;
      fromCache?: boolean;
      offline?: boolean;
      error?: string;
    }) => void,
  ) => {
    if (request.type === 'FETCH_APOD') {
      handleFetchApod(request.date, request.lang).then(sendResponse);
      return true; // Keep channel open for async
    }
    if (request.type === 'FETCH_RANDOM') {
      handleFetchRandom(request.lang, request.allowLowRes).then(sendResponse);
      return true;
    }
    if (request.type === 'CLEAR_BUFFER') {
      handleClearBuffer(request.lang, request.allowLowRes).then(sendResponse);
      return true;
    }
  },
);

async function handleFetchApod(date?: string, lang?: string) {
  try {
    const rawData = await fetchApod(date, lang);
    const enriched = await enrichData(rawData);

    // Cache it
    const today = date || new Date().toISOString().split('T')[0];
    await chrome.storage.local.set({ [today]: enriched });
    return { data: enriched, fromCache: false };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Fallback to latest cached if any error
    const allCache = await chrome.storage.local.get(null);
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
  await chrome.storage.local.set({ [BUFFER_KEY]: [] });
  refillBufferIfNeeded(0, lang, allowLowRes);
  return { data: { success: true } };
}

async function handleFetchRandom(lang?: string, allowLowRes?: boolean) {
  try {
    const result = await chrome.storage.local.get(BUFFER_KEY);
    const buffer: any[] = Array.isArray(result[BUFFER_KEY]) ? result[BUFFER_KEY] : [];

    if (buffer.length > 0) {
      const dataToReturn = buffer.shift();
      await chrome.storage.local.set({ [BUFFER_KEY]: buffer });
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
    const allCache = await chrome.storage.local.get(null);
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
  const MAX_ATTEMPTS = 10;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const rawData = await fetchRandomApod(lang);
    const dims = rawData.url ? await getImageDimensions(rawData.hdurl || rawData.url) : null;

    const isHighRes = dims && dims.width >= MIN_WIDTH && dims.height >= MIN_HEIGHT;

    if (allowLowRes || isHighRes || !dims) {
      // Attach dimensions to the data so MediaSection can utilise them
      const enriched = await enrichData({
        ...rawData,
        width: dims?.width,
        height: dims?.height,
      });
      return enriched;
    }

    console.log(`[buffer] Skipping low-res image (${dims.width}x${dims.height}): ${rawData.title}`);
  }

  // Exhausted attempts — fall back to whatever we have regardless of res
  const rawData = await fetchRandomApod(lang);
  const dims = rawData.url ? await getImageDimensions(rawData.hdurl || rawData.url) : null;
  return enrichData({ ...rawData, width: dims?.width, height: dims?.height });
}

async function refillBufferIfNeeded(currentLength: number, lang?: string, allowLowRes?: boolean) {
  if (isRefilling || currentLength >= BUFFER_LIMIT) return;
  isRefilling = true;
  try {
    const needed = BUFFER_LIMIT - currentLength;
    for (let i = 0; i < needed; i++) {
      const enriched = await fetchAndValidateRandomApod(lang, allowLowRes);
      const result = await chrome.storage.local.get(BUFFER_KEY);
      const currentBuffer: any[] = Array.isArray(result[BUFFER_KEY]) ? result[BUFFER_KEY] : [];
      currentBuffer.push(enriched);
      await chrome.storage.local.set({ [BUFFER_KEY]: currentBuffer });
    }
  } catch (err) {
    console.error('Failed to refill random buffer', err);
  } finally {
    isRefilling = false;
  }
}

// ─── Lifecycle & Pre-fetching ────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  // Prime the buffer on first install
  chrome.storage.local.get(BUFFER_KEY).then((result) => {
    const buffer: any[] = Array.isArray(result[BUFFER_KEY]) ? result[BUFFER_KEY] : [];
    refillBufferIfNeeded(buffer.length);
  });
});

chrome.runtime.onStartup.addListener(() => {
  // Ensure buffer is full when browser starts
  chrome.storage.local.get(BUFFER_KEY).then((result) => {
    const buffer: any[] = Array.isArray(result[BUFFER_KEY]) ? result[BUFFER_KEY] : [];
    refillBufferIfNeeded(buffer.length);
  });
});
