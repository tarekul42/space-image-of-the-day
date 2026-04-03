# 🌌 Space Image of the Day — Chrome Extension

> *A new piece of the cosmos, every time you open a tab.*

---

## The Story

I've always loved space. There's something humbling about opening a new browser tab and being reminded how enormous the universe is.

NASA publishes a new **Astronomy Picture of the Day (APOD)** every single day — a stunning image or video captured by telescopes and space missions from around the world. But the only way to see it was to visit their website directly. So I thought: *what if it was just there, every time you opened a new tab?*

That simple question turned into an engineering project that taught me more about browser extension architecture, API design, and UX empathy than I expected.

---

## Chapter 1: The Obvious Approach, and Why It Wasn't Good Enough

My first instinct was straightforward: the extension opens → fetch the NASA API → display the image. Simple.

But I immediately hit a problem.

### The CORS Wall
Chrome extensions run in a very restricted security context. When a React component inside `index.html` tries to call `https://api.nasa.gov` directly, the browser blocks it. This is the [same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy) — and it's **not a bug, it's a feature**.

I could have added the domain to `host_permissions` in `manifest.json` and been done. But then I thought further: every API call would happen in the UI thread, on every single new tab open. If NASA's API was slow, the user would stare at a loading spinner. If they opened 5 tabs quickly, they'd make 5 redundant API calls. And they'd burn through NASA's `DEMO_KEY` rate limit almost immediately.

That's not a product I'd want to use.

### The Solution: The Service Worker as a Traffic Controller

Manifest V3 (the current standard for Chrome Extensions) comes with a `background.js` — a **Service Worker** that runs independently of the UI. It's the heartbeat of the extension.

I moved all data-fetching logic into `background.ts`:

```
React UI  ──sendMessage──►  background.ts  ──fetch──►  Backend API
                ◄──response──                ◄──json──
```

The UI never talks to external APIs directly. It sends a message (`FETCH_APOD` or `FETCH_RANDOM`), and the service worker handles everything. This architecture gives me:

- **No CORS issues:** Service workers have their own network context.
- **Centralized caching:** Data is cached in `chrome.storage.local` at the service worker level — not the component level.
- **Zero redundant calls:** If the data for today is already cached, it's served instantly.

---

## Chapter 2: "What If the Server is Down?"

I built a backend (Node.js/TypeScript with Bun) to handle the NASA API calls and add SIMBAD astronomical enrichment. But I asked myself: *what happens when a user opens a new tab and my server is offline?*

For most web apps, the answer is "show an error." But this is a **new tab replacement**. If it breaks, it kills the user's entire browser workflow.

So I built an offline fallback directly into the service worker:

```typescript
// background.ts
async function handleFetchApod(date?: string) {
  try {
    const rawData = await fetchApod(date);
    const enriched = await enrichData(rawData);
    // Cache the successful result
    await chrome.storage.local.set({ [today]: enriched });
    return { data: enriched, fromCache: false };
  } catch (error) {
    // Server down? Fall back to the most recent cached image.
    const allCache = await chrome.storage.local.get(null);
    const keys = Object.keys(allCache).sort().reverse();
    if (keys.length > 0) {
      return { data: allCache[keys[0]], fromCache: true, offline: true };
    }
    return { error: errorMessage };
  }
}
```

Every successful fetch writes to local storage. On failure, the extension silently serves the most recently cached image. The user still gets their cosmic wallpaper — they just don't know the server had a bad day.

---

## Chapter 3: Just Showing a Picture Felt Lazy

NASA's APOD data includes a title and explanation, but nothing about *what* is actually in the image. I wanted to give users more context — the type of galactic object, additional resources.

I discovered the **SIMBAD Astronomical Database** run by the Centre de Données astronomiques de Strasbourg. It has records for millions of celestial objects.

I built an enrichment pipeline that runs *after* the NASA data is fetched:

1. **Extract a likely object name** from the image title using regex — stripping photographer credits, parentheticals, and noise.
2. **Query SIMBAD** with that name.
3. **Parse the VOTable XML response** to identify the object type (Galaxy, Nebula, Pulsar, etc.).
4. **Merge the result** back into the APOD data object.

```typescript
// enrichment.ts
export async function enrichData(nasaData: ApodData): Promise<ApodData> {
  const objectName = extractObjectName(nasaData.title);
  const simbad = await querySimbad(objectName);
  const inferred = inferFromExplanation(nasaData.title, nasaData.explanation);

  return {
    ...nasaData,
    object_type: simbad?.objectType || inferred.objectType,
    more_info_url: simbad?.more_info_url || `https://en.wikipedia.org/...`,
  };
}
```

If SIMBAD fails (it sometimes does — the image might be of a planetary aurora, or a rocket launch), the pipeline degrades gracefully to a keyword-matching fallback that reads the explanation text for clues like "galaxy," "nebula," or "supernova remnant."

---

## Chapter 4: The Development Environment Problem

With the core architecture in place, I had a problem: **I couldn't preview the UI in a browser.**

The entire data flow depends on `chrome.runtime.sendMessage`. Open the page at `localhost:5173` and you immediately get:

```
Cannot read properties of undefined (reading 'sendMessage')
```

Because `chrome.runtime` simply doesn't exist outside extension context. You'd have to `npm run build`, drag the `dist/` folder into `chrome://extensions`, reload, and open a new tab — for every single CSS tweak.

That's a terrible developer experience.

I solved this by adding an **environment detection fallback** in the state management layer:

```typescript
// ApodContext.tsx
const fetchApod = useCallback(async (type = 'FETCH_APOD') => {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      // Real extension: use the service worker bridge
      const response = await chrome.runtime.sendMessage({ type });
      setApod(response.data);
    } else {
      // Dev mode: call the backend services directly
      console.warn('Chrome runtime not found. Using development fallback.');
      const rawData = type === 'FETCH_APOD' ? await fetchDirect() : await fetchRandomDirect();
      const enriched = await enrichData(rawData);
      setApod(enriched);
    }
  } catch (err) { ... }
}, []);
```

Now `localhost:5173` works exactly like the real extension. Hot Module Reload, instant feedback, no rebuilds.

---

## Chapter 5: Rethinking the UI for the Real World

I built a beautiful initial UI: a full 12-column grid with a massive image card on the left and a detailed info panel on the right. It looked stunning in isolation.

Then I thought: *this is a new tab page.*

On a real new tab, a user might have a search bar, recent bookmarks, a pinned news widget, or their own shortcuts. My extension was consuming the entire screen with information they didn't ask for at that moment. It felt like a colleague who talks at you the second you open a door.

I remembered a [Google UX study on browser start pages](https://design.google/library/redesigning-chrome/) — users primarily want to **get somewhere fast**. The imagery should be a backdrop to their intent, not compete with it.

So I stripped it all down:

- **The image becomes the wallpaper.** It fills the entire screen edge-to-edge with no dimming, no rounded card, no border. Pure, beautiful space.
- **The info lives in a minimal widget**, pinned to the bottom-left — the corner with the lowest natural eye-tracking priority, leaving the center completely free.
- **The explanation text is hidden by default.** Users can toggle it open with a single click. No text walls on load.

```
┌─────────────────────────────────────────────┐
│                                             │
│         [Full-screen NASA Image]            │
│                                             │
│                                             │
│  ┌──────────────────────┐                   │
│  │  🔭 Cosmic Discovery  │                   │
│  │  NGC 1087 Galaxy      │  [ℹ] [Next][HD]  │
│  └──────────────────────┘                   │
└─────────────────────────────────────────────┘
```

The center of the screen stays clear. That's where users focus when they're about to type a URL or search. The extension respects that intention.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 |
| Build Tool | Vite + Bun |
| Styling | Tailwind CSS v4 (beta) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Extension API | Chrome Manifest V3 |
| Type Safety | TypeScript |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Chrome Extension                        │
│                                                             │
│   ┌─────────────┐       ┌─────────────────────────────┐    │
│   │  React UI   │──────▶│   background.ts (SW)        │    │
│   │ (index.tsx) │◀──────│   - Fetches & enriches data │    │
│   └─────────────┘  msg  │   - Caches in chrome.storage│    │
│                         └───────────┬─────────────────┘    │
│                                     │ HTTP                  │
└─────────────────────────────────────│─────────────────────┘
                                      ▼
                         ┌────────────────────────┐
                         │  Backend (Bun/Express) │
                         │  localhost:5000         │
                         │  - NASA APOD API proxy  │
                         │  - Redis caching        │
                         └────────────┬───────────┘
                                      │
                          ┌───────────┴──────────┐
                          │                      │
                   ┌──────▼──────┐    ┌──────────▼────────┐
                   │   NASA API  │    │   SIMBAD Database  │
                   └─────────────┘    └───────────────────-┘
```

---

## Running Locally

**Prerequisites:** Node.js / Bun, the backend service running on `localhost:5000`.

```bash
# Install dependencies
bun install

# Start dev server (live preview at localhost:5173)
bun run dev

# Build for Chrome
bun run build
# Then load the /dist folder in chrome://extensions with Developer Mode on
```

---

## What I'd Build Next

- **Central search bar** in the empty middle of the screen, making the extension a true productivity tool.
- **Quick links row** above the widget for user's top sites.
- **A "This Week in Space" mode** that cycles through the past 7 days of APOD automatically.
- **Progressive image loading**: show the standard-res `url` first while the HD version loads silently in the background.

---

*Built with curiosity and a lot of coffee. If you're reading this as a recruiter — thanks for getting this far. The fact that you did probably means we'd have interesting things to talk about.*
