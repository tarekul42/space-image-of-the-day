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

## The Result

| Scenario | Before | After |
|---|---|---|
| Same picture every tab | ✅ | ❌ Eliminated — every tab is unique |
| Videos appearing as APOD | ✅ | ❌ Filtered at source — images only |
| Loading spinner on tab open | ✅ | ❌ Eliminated — pre-fetched buffer |
| Loading spinner on browser start | ✅ | ❌ Eliminated — `onStartup` hook |
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
| **Service Worker** | Background orchestration |

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

- [x] Modular backend architecture (domain-driven)
- [x] Redis API caching layer
- [x] Random image shuffle on every new tab
- [x] Video content filtering
- [x] Zero-latency pre-fetching buffer
- [x] Browser startup pre-loading
- [ ] Interactive astronomer's star map overlay
- [ ] Multi-lingual cosmic explanations

---

## License

MIT — Built & designed by [tarekul42](https://github.com/tarekul42)
