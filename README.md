# 🌌 Space Image of the Day — Chrome Extension

> *A developer's story of building an extension that turns every new tab into a window to the universe.*

[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Tailwind%20v4-blueviolet)](https://github.com/tarekul42)
[![Backend](https://img.shields.io/badge/Backend-Bun%20%2B%20Express%20%2B%20Redis-red)](https://github.com/tarekul42)
[![Build](https://img.shields.io/badge/Build-Passing-brightgreen)](https://github.com/tarekul42)
[![License](https://img.shields.io/badge/License-MIT-green)](https://github.com/tarekul42)

---

## The Origin

It started simply enough. NASA publishes a free, public API — the **Astronomical Picture of the Day (APOD)** — that has been serving stunning, expert-curated images of the cosmos since 1995. Every single day, a new image. Every single one breathtaking.

I thought: *what if every time I opened a new browser tab, instead of staring at a blank white page or a search bar, I was greeted by the Andromeda galaxy, or a supernova remnant, or the rings of Saturn?* That feeling of wonder, every day, for free.

I started building. And like every project that starts "simply enough," it quickly revealed layers that demanded real engineering.

---

## Chapter 1: The Architecture Problem — Why Not Just Call NASA Directly?

The first instinct was obvious: call the NASA API from the browser extension itself. Quick, simple, done.

But I stopped myself. If every user hitting my extension hammers the NASA API with their own key, we hit rate limits fast. Also, there's no caching — the same image gets fetched again and again for the same date. And the extension becomes brittle; one API change breaks everything for every user simultaneously.

So I separated concerns properly. I built a **dedicated backend server** that acts as an intelligent proxy:

- It calls NASA once per day per date, then **caches the result in Redis for 24 hours**
- Every subsequent user requesting the same date gets a sub-millisecond Redis response instead of a 300ms+ NASA roundtrip
- The extension only ever talks to *my* server, giving me full control over the data contract

**Stack:**
- **Runtime**: [Bun](https://bun.sh) — significantly faster startup and execution than Node.js
- **Framework**: Express + TypeScript — familiar, battle-tested, type-safe
- **Cache**: Redis — because a NASA response that never changes within a day shouldn't be fetched more than once
- **Validation**: Zod — strict environment variable and request validation to fail loudly and early
- **Security**: Helmet, CORS, express-rate-limit — production hardening from day one

---

## Chapter 2: The "Dead Tab" Problem — Same Picture, Every Time

The backend was solid. The extension worked. I opened a new tab and saw Jupiter. Beautiful.

Then I reloaded. Jupiter again.

Then again. Jupiter.

The daily APOD is, by definition, one image per day. A user who opens 20 tabs in a day gets Jupiter 20 times. The extension that was supposed to bring wonder was quickly becoming wallpaper.

**The fix was conceptual before it was technical:** *every new tab should feel like a new discovery.*

I added a `/random` endpoint to the backend. NASA's APOD API supports a `count` parameter — ask it for `count=5` and it gives back 5 random APODs from its entire archive of 30+ years.

In the frontend's service worker (`background.ts`), the initial fetch was updated from:

```ts
// Before: same picture every day
fetchApod();

// After: a new random discovery every tab
fetchApod('FETCH_RANDOM');
```

The extension immediately felt alive.

---

## Chapter 3: The Video Problem — A Hidden UX Landmine

While testing the randomness, I noticed something: occasionally NASA returns a **YouTube video embed** as the APOD instead of an image. The API field is `media_type: "video"`.

In an extension designed to be a beautiful, ambient visual backdrop to your browser session, a video is a disaster — it loads slowly, plays unexpectedly on networks with poor bandwidth, can autoplay with sound, and completely shatters the calm, immersive atmosphere the extension is designed to create.

The fix happened at the backend level — the right place, where it can be enforced universally:

```ts
// apod.service.ts — getRandomApod()
while (attempts < 3) {
  // Fetch 5 at a time for efficiency
  const response = await axios.get(NASA_APOD_URL, { params: { count: 5 } });

  // Filter: only images, no videos
  const imageItem = items.find(item => item.media_type === "image");

  if (imageItem) return { data: imageItem, source: "api" };
  attempts++;
}
```

By requesting 5 results per call and filtering for `media_type === "image"`, we statistically almost always find an image in the first batch. If by extreme coincidence all 5 results are videos, it retries up to 3 times. Only then does it throw — which in practice never happens.

The user never sees a video. Ever.

---

## Chapter 4: The Latency Problem — The Loading Screen That Killed the Vibe

With randomness and image-only filtering working, there was still a problem. Every new tab triggered a network request chain:

`Extension → My API Server → NASA API → back through the chain`

In production, even with Redis caching the existing APOD dates, the random endpoint hits NASA fresh every time. Best case: ~200-400ms on a good connection. Worst case: over a second.

Opening a new tab and watching a loading spinner for a full second is a **flow-breaking experience**. The whole point of the extension is to make you feel good instantly. A loading state is the opposite of that.

**The insight:** the user doesn't need to wait *during* tab open. They need the image to be *already there*.

I engineered a **Background Pre-fetching Buffer** — a queue of pre-loaded, ready-to-render images silently maintained in `chrome.storage.local`:

```
BUFFER STATE (always maintained at 3):
[image_A, image_B, image_C]
          ↓
User opens tab → instantly pop image_A → render immediately (0ms wait)
          ↓
Background worker silently fetches image_D → push to back of queue
          ↓
BUFFER STATE (refilled):
[image_B, image_C, image_D]  ← ready for the next tab
```

The rendering is now instantaneous. The network call happens *after* the image is already on screen.

```ts
// background.ts — handleFetchRandom()
const buffer = Array.isArray(result[BUFFER_KEY]) ? result[BUFFER_KEY] : [];

if (buffer.length > 0) {
  const dataToReturn = buffer.shift(); // instant, from local storage
  refillBufferIfNeeded(buffer.length); // silent, async, doesn't block UI
  return { data: dataToReturn };
}
```

---

## Chapter 5: The Startup Problem — The First Tab After Coffee

The buffer system was elegant, but there was one more edge case I thought of: **what happens when someone opens their browser in the morning?**

Chrome extensions' service workers can be suspended. If the browser was closed, the buffer might be stale or partially depleted. The very first tab of the day — arguably the most important one — could still hit that loading state.

The fix was to hook directly into the browser's own lifecycle events:

```ts
// Fires when the browser itself starts up
chrome.runtime.onStartup.addListener(() => {
  refillBufferIfNeeded(currentBufferLength);
});

// Fires on first install
chrome.runtime.onInstalled.addListener(() => {
  refillBufferIfNeeded(currentBufferLength);
});
```

Now, the moment Chrome launches — before the user has even reached for their mouse — the extension is silently downloading the next batch of space images in the background. By the time they click "New Tab", it's already there, waiting.

---

## Chapter 6: The Resolution Problem — Blurry Images on Big Screens

With the pre-fetching buffer working well, a new quality problem emerged. NASA's APOD archive spans 30+ years. Some older images are tiny — `480×320`, `640×480` — images from the 1990s and early 2000s. When displayed fullscreen on a modern 4K monitor, they stretch to oblivion.

**The fix needed to be invisible.** A spinner saying "searching for HD image..." would ruin the instant-load experience we'd worked so hard to achieve.

The solution was to inspect image dimensions *inside the buffer pre-fill step*, before the image ever reaches the user:

```ts
// background.ts — getImageDimensions()
async function getImageDimensions(url: string) {
  const blob = await fetch(url).then(r => r.blob());
  const bitmap = await createImageBitmap(blob);
  const dims = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return dims;
}

// Inside refillBufferIfNeeded — retry loop
const dims = await getImageDimensions(rawData.hdurl || rawData.url);
const isHighRes = dims.width >= 1000 && dims.height >= 700;

if (!allowLowRes && !isHighRes) {
  console.log(`Skipping low-res (${dims.width}x${dims.height}): ${rawData.title}`);
  continue; // fetch another one
}
```

`createImageBitmap` is a native Web API available inside Service Workers. It decodes the image and exposes dimensions without ever touching the DOM — zero UI impact.

By default, only images ≥ 1000×700 px enter the buffer. Users who *want* to see older, smaller archive images can toggle it on via a **Settings panel**, which renders small images naturally sized on an animated starfield background instead of stretching them fullscreen.

---

## Chapter 7: Speaking the Universe's Language — Multi-lingual Explanations

NASA writes every APOD description in English. But space belongs to everyone.

Adding browser-side translation was not an option — it would mean shipping translation API keys into the extension bundle (a security antipattern) or making unpredictable third-party network calls that would slow down the rendering path.

Instead, translation happens on the **backend**, in the same place caching and filtering already live:

```ts
// apod.service.ts
if (targetLang !== 'en') {
  const [titleRes, expRes] = await Promise.all([
    translate(data.title, { to: targetLang }),
    translate(data.explanation, { to: targetLang }),
  ]);
  data = { ...data, title: titleRes.text, explanation: expRes.text };
}

// Cache key now includes language — Spanish gets its own slot
const cacheKey = `apod:${targetLang}:${targetDate}`;
```

The cache key is scoped by both language and date (`apod:es:2024-04-04`). The first user to request an APOD in Spanish pays the translation cost once. Every subsequent Spanish request is a Redis cache hit — sub-millisecond, free.

The language selector sits unobtrusively in the top-right corner. Changing language triggers a `CLEAR_BUFFER` message to the service worker, which immediately begins pre-filling a fresh buffer in the new language so the *next* tab is already translated before the user clicks it.

---

## The Result

| Scenario | Before | After |
|---|---|---|
| Same picture every tab | ✅ | ❌ Eliminated — every tab is unique |
| Videos appearing as APOD | ✅ | ❌ Filtered at source — images only |
| Loading spinner on tab open | ✅ | ❌ Eliminated — pre-fetched buffer |
| Loading spinner on browser start | ✅ | ❌ Eliminated — `onStartup` hook |
| Blurry low-res images fullscreen | ✅ | ❌ Filtered by default via bitmap probing |
| English-only descriptions | ✅ | ❌ 11 languages, server-translated & cached |
| API overuse / rate limits | Risk | Mitigated via Redis + proxy server |
| NASA API change breaks all users | Risk | Mitigated — server is the single point of update |

---

## Technology Breakdown

### Backend (`space-image-of-the-day-backend`)
| Tool | Role |
|---|---|
| **Bun** | High-performance JS runtime |
| **Express + TypeScript** | HTTP server, fully typed |
| **Redis** | API response caching (24hr TTL) |
| **Zod** | Env validation & type safety |
| **Pino** | Structured JSON logging |
| **Helmet + CORS + Rate Limit** | Production security hardening |

### Extension (`space-image-of-the-day-frontend`)
| Tool | Role |
|---|---|
| **React 19** | Component-driven UI |
| **Vite 6** | Bundler & dev server |
| **Tailwind CSS v4** | Utility-first styling |
| **Framer Motion** | Smooth, performant animations |
| **Chrome Storage API** | Pre-fetching buffer persistence |
| **Service Worker** | Background orchestration, resolution probing, language routing |
| **`createImageBitmap`** | Native dimension inspection in service worker (no DOM) |

---

## Running Locally

### Backend
```bash
cd space-image-of-the-day-backend
cp .env.example .env  # Add your NASA_API_KEY
bun install
bun run dev           # Starts on http://localhost:5000
```

### Extension
```bash
cd space-image-of-the-day-frontend
bun install
bun run build         # Outputs to /dist
```

Then go to `chrome://extensions`, enable **Developer Mode**, and **Load unpacked** from the `/dist` folder.

---

## Roadmap

### v1 — Shipped ✅
- [x] Modular backend architecture (domain-driven)
- [x] Redis API caching layer
- [x] Random image shuffle on every new tab
- [x] Video content filtering
- [x] Zero-latency pre-fetching buffer
- [x] Browser startup pre-loading
- [x] Star map simulation overlay
- [x] Multi-lingual cosmic explanations (11 languages, server-cached)
- [x] HD image resolution filtering (≥1000×700) with low-res opt-in
- [x] Consolidated settings panel (language + resolution toggle)

### v2 — Planned 🚀
- [ ] Real positional star map (RA/Dec from SIMBAD, rendered via D3)
- [ ] Central search bar — make the extension a true productivity tool
- [ ] "This Week in Space" mode — auto-cycle last 7 days of APOD
- [ ] Progressive image loading — low-res preview → silent HD upgrade
- [ ] Quick-links row for user's top sites

---

## License

MIT — Built & designed by [tarekul42](https://github.com/tarekul42)
