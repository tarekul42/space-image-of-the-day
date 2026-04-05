import browser from './browser';
import { fetchApod, fetchRandomApod } from './services/apod.service';
import { enrichData } from './utils/enrichment';
import { saveImageBlob, clearOldImages } from './utils/storage';
import { starterApods } from './data/starterApods';

// ─── Constants ───────────────────────────────────────────────
const MIN_WIDTH = 1000;
const MIN_HEIGHT = 700;
const BUFFER_LIMIT = 10;
const BUFFER_KEY = 'random_buffer';
const PURGE_KEY = 'cache_purge_v2';

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

// ─── Message Handling ────────────────────────────────────────

browser.runtime.onMessage.addListener(
  (
    request: unknown,
    _sender: browser.Runtime.MessageSender,
  ) => {
    const req = request as { type: string; date?: string; lang?: string; allowLowRes?: boolean };

    // Use a pattern that ensures we ALWAYS return a promise or false.
    // This prevents "Receiving end does not exist" synchronously.
    switch (req.type) {
      case 'FETCH_APOD':
      case 'UPDATE_TRANSLATION':
        return handleFetchApod(req.date, req.lang);
      case 'FETCH_RANDOM':
        return handleFetchRandom(req.lang, req.allowLowRes);
      case 'CLEAR_BUFFER':
        return handleClearBuffer(req.lang, req.allowLowRes);
      default:
        return false; // Not a known message type
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

    if (data?.blob && data.blob.size > 1024) {
      await saveImageBlob(rawData.date, data.blob);
    }

    const today = date || new Date().toISOString().split('T')[0];
    await browser.storage.local.set({ [today]: enriched });
    return { data: enriched, fromCache: false };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const allCache = await browser.storage.local.get(null);
    const keys = Object.keys(allCache)
      .filter((k) => k !== BUFFER_KEY && k !== PURGE_KEY)
      .sort()
      .reverse();
    if (keys.length > 0) {
      return { data: allCache[keys[0]], fromCache: true, offline: true };
    }
    return { error: errorMessage };
  }
}

let isRefilling = false;

async function handleClearBuffer(lang?: string, allowLowRes?: boolean) {
  await browser.storage.local.set({ [BUFFER_KEY]: [] });
  // Start the incremental refill chain
  setTimeout(() => refillBufferIfNeeded(lang, allowLowRes), 0);
  return { success: true };
}

async function handleFetchRandom(lang?: string, allowLowRes?: boolean) {
  try {
    const result = await browser.storage.local.get(BUFFER_KEY);
    const buffer: any[] = Array.isArray(result[BUFFER_KEY]) ? result[BUFFER_KEY] : [];

    if (buffer.length > 0) {
      const dataToReturn = buffer.shift();
      await browser.storage.local.set({ [BUFFER_KEY]: buffer });
      // Lazy refill ONE item in the background
      setTimeout(() => refillBufferIfNeeded(lang, allowLowRes), 100);
      return { data: dataToReturn };
    } else {
      // ZERO LATENCY FALLBACK: If buffer is empty, return a random starter image
      // while triggering a refill in the background.
      const fallback = starterApods[Math.floor(Math.random() * starterApods.length)];
      console.log(`[buffer] Empty! Using fallback: ${fallback.title}`);
      
      setTimeout(() => refillBufferIfNeeded(lang, allowLowRes), 100);
      return { data: fallback, fromFallback: true };
    }
  } catch (error: unknown) {
    // Final safety: even if everything fails, return the first starter APOD
    return { data: starterApods[0], fromFallback: true };
  }
}

/**
 * Incremental Refill - Fetches EXACTLY ONE item if space remains.
 * This prevents long-running loops that can cause the script to hang.
 */
async function refillBufferIfNeeded(lang?: string, allowLowRes?: boolean) {
  if (isRefilling) return;
  
  const result = await browser.storage.local.get(BUFFER_KEY);
  const currentBuffer: any[] = Array.isArray(result[BUFFER_KEY]) ? result[BUFFER_KEY] : [];
  
  if (currentBuffer.length >= BUFFER_LIMIT) {
    // Cleanup blobs we no longer need
    performCleanup(currentBuffer);
    return;
  }

  isRefilling = true;
  try {
    console.log(`[buffer] refilling incrementally. Current size: ${currentBuffer.length}`);
    const enriched = await fetchAndValidateRandomApod(lang, allowLowRes);
    
    // Check again to avoid races
    const freshResult = await browser.storage.local.get(BUFFER_KEY);
    const freshBuffer: any[] = Array.isArray(freshResult[BUFFER_KEY]) ? freshResult[BUFFER_KEY] : [];
    
    if (freshBuffer.length < BUFFER_LIMIT) {
      freshBuffer.push(enriched);
      await browser.storage.local.set({ [BUFFER_KEY]: freshBuffer });
    }
  } catch (err) {
    console.error('Incremental refill failed', err);
  } finally {
    isRefilling = false;
  }
}

async function performCleanup(buffer: any[]) {
  try {
    const result = await browser.storage.local.get(null);
    const bufferedDates = buffer.map((item: any) => item.date);
    const today = new Date().toISOString().split('T')[0];
    const cachedDates = Object.keys(result).filter((k) => k !== BUFFER_KEY);
    await clearOldImages([...bufferedDates, ...cachedDates, today]);
  } catch (err) {
    console.error('Cleanup failed', err);
  }
}

/**
 * Fetch a random APOD and verify its resolution.
 * Retries until a qualifying image is found (up to 5 attempts).
 */
async function fetchAndValidateRandomApod(lang?: string, allowLowRes?: boolean) {
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const rawData = await fetchRandomApod(lang);
    if (rawData.media_type !== 'image') continue;

    const data = rawData.url ? await getImageData(rawData.hdurl || rawData.url) : null;
    if (!data) continue;

    const isHighRes = data.width >= MIN_WIDTH && data.height >= MIN_HEIGHT;
    if (allowLowRes || isHighRes) {
      if (data.blob) await saveImageBlob(rawData.date, data.blob);
      return await enrichData({ ...rawData, width: data.width, height: data.height });
    }
  }

  // Fallback
  const rawData = await fetchRandomApod(lang);
  const data = rawData.url ? await getImageData(rawData.hdurl || rawData.url) : null;
  if (data?.blob) await saveImageBlob(rawData.date, data.blob);
  return enrichData({ ...rawData, width: data?.width, height: data?.height });
}

// ─── Lifecycle ───────────────────────────────────────────────

browser.runtime.onInstalled.addListener(async (details) => {
  // 1. One-time Cache Purge for the ORB fix
  const purgeCheck = await browser.storage.local.get(PURGE_KEY);
  if (!purgeCheck[PURGE_KEY]) {
    console.log('[install] Purging legacy "poisoned" cache (ORB Migration)...');
    try {
      await clearOldImages([]); // Empty array = clear all
      await browser.storage.local.set({ [PURGE_KEY]: true });
    } catch (err) {
      console.error('[install] Purge failed:', err);
    }
  }

  if (details.reason === 'install' || details.reason === 'update') {
    // Prime with STARTER DATA for instant first impression
    console.log('[install] Seeding starter buffer (Nerd-Scale)...');
    
    // We don't fill the random_buffer with ALL 20 to keep it manageable,
    // but we pre-fetch the BLOBS for all 20 so the fallback is instant.
    await browser.storage.local.set({ [BUFFER_KEY]: starterApods.slice(0, 10) });
    
    // Progressively fetch blobs for ALL starter data
    for (const item of starterApods) {
      try {
        const data = await getImageData(item.hdurl || item.url);
        // Safety: ensure blob is not empty (ORB check)
        if (data?.blob && data.blob.size > 1024) {
          await saveImageBlob(item.date, data.blob);
          console.log(`[install] Pre-fetched blob for: ${item.title} (${Math.round(data.blob.size/1024)}KB)`);
        } else {
          console.warn(`[install] Skipping empty/corrupted blob for: ${item.title}`);
        }
        // Small delay to be polite
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error(`[install] Failed to pre-fetch blob:`, err);
      }
    }
  }
  
  // Schedule full refill check
  refillBufferIfNeeded();
});

browser.runtime.onStartup.addListener(() => {
  refillBufferIfNeeded();
});
