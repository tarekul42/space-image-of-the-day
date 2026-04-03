/**
 * background.ts - Chrome Extension Service Worker
 * Coordinates fetching, enrichment, and caching.
 */

import { fetchApod, fetchRandomApod } from './services/apod.service';
import { enrichData } from './utils/enrichment';

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
    const rawData = await fetchApod(date);
    const enriched = await enrichData(rawData);

    // Cache it
    const today = date || new Date().toISOString().split('T')[0];
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
    const rawData = await fetchRandomApod();
    const enriched = await enrichData(rawData);
    return { data: enriched };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { error: errorMessage };
  }
}
