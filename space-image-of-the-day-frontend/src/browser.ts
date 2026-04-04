/**
 * browser.ts — Unified browser API shim
 *
 * Exports Mozilla's webextension-polyfill as `browser`.
 * On Chrome, the polyfill wraps chrome.* callbacks with a promise-based API.
 * On Firefox, the native `browser.*` API is used directly.
 *
 * Import from here instead of using `chrome.*` or `browser.*` directly
 * so the codebase stays portable across both browsers.
 */
import browser from 'webextension-polyfill';

export default browser;
