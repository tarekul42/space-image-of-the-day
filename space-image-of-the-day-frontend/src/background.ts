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
    const keys = Object.keys(allCache).filter(k => k !== 'random_buffer').sort().reverse();
    if (keys.length > 0) {
      return { data: allCache[keys[0]], fromCache: true, offline: true };
    }
    return { error: errorMessage };
  }
}

const BUFFER_LIMIT = 3;
const BUFFER_KEY = 'random_buffer';
let isRefilling = false;

async function handleFetchRandom() {
  try {
    const result = await chrome.storage.local.get(BUFFER_KEY);
    const buffer: any[] = Array.isArray(result[BUFFER_KEY]) ? result[BUFFER_KEY] : [];

    if (buffer.length > 0) {
      const dataToReturn = buffer.shift();
      await chrome.storage.local.set({ [BUFFER_KEY]: buffer });
      refillBufferIfNeeded(buffer.length);
      return { data: dataToReturn };
    } else {
      const rawData = await fetchRandomApod();
      const enriched = await enrichData(rawData);
      refillBufferIfNeeded(0);
      return { data: enriched };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const allCache = await chrome.storage.local.get(null);
    const keys = Object.keys(allCache).filter(k => k !== BUFFER_KEY).sort().reverse();
    if (keys.length > 0) {
      return { data: allCache[keys[0]], fromCache: true, offline: true };
    }
    return { error: errorMessage };
  }
}

async function refillBufferIfNeeded(currentLength: number) {
  if (isRefilling || currentLength >= BUFFER_LIMIT) return;
  isRefilling = true;
  try {
    const needed = BUFFER_LIMIT - currentLength;
    for (let i = 0; i < needed; i++) {
        const rawData = await fetchRandomApod();
        const enriched = await enrichData(rawData);
        const result = await chrome.storage.local.get(BUFFER_KEY);
        const currentBuffer: any[] = Array.isArray(result[BUFFER_KEY]) ? result[BUFFER_KEY] : [];
        currentBuffer.push(enriched);
        await chrome.storage.local.set({ [BUFFER_KEY]: currentBuffer });
    }
  } catch (err) {
    console.error("Failed to refill random buffer", err);
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
