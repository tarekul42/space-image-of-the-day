# 🛰️ Space Image of the Day — Backend API

> *The story of building a production-grade API server that acts as a smart, resilient proxy between a Chrome extension and NASA's data — and why "just calling the API directly" was never an option.*

[![Runtime](https://img.shields.io/badge/Runtime-Bun-black)](https://bun.sh)
[![Framework](https://img.shields.io/badge/Framework-Express%20%2B%20TypeScript-blue)](https://expressjs.com)
[![Cache](https://img.shields.io/badge/Cache-Redis-red)](https://redis.io)
[![Build](https://img.shields.io/badge/Build-Passing-brightgreen)](https://github.com/tarekul42)
[![License](https://img.shields.io/badge/License-MIT-green)](https://github.com/tarekul42)

> **Part of:** [Space Image of the Day Chrome Extension](https://github.com/tarekul42) — see the frontend repo for the full product story.

---

## Why Does a Chrome Extension Need Its Own Backend?

This was the first real engineering decision of the project, and it shaped everything that came after.

The naïve approach: embed a NASA API key directly in the extension and call NASA from the browser. It works. For exactly one user, for exactly one day.

The problems surface quickly:
- **Rate limits**: NASA's free tier allows 1,000 requests/day *per API key*. Distributed across many users with their own keys, fine. But with a single shared key and no caching, even modest usage burns through it fast.
- **No caching layer**: The daily APOD image doesn't change for 24 hours. Without a cache, every single tab open for every user re-fetches the same unchanged data.
- **Zero control over the data contract**: If NASA changes their API response shape, every installed extension breaks simultaneously with no way to patch it remotely.
- **Security**: Shipping API keys in browser extension bundles is an antipattern. Keys get extracted, abused, and revoked.

**The decision**: build a dedicated API server. The extension talks to my server. My server talks to NASA — once per day per date, then serves from cache for all subsequent requests. API key stays on the server. Data contract stays under my control.

---

## Chapter 1: The Architecture — Domain-Driven, Not Just "A Server"

I didn't want to write a `server.js` with 200 lines of spaghetti. The backend is designed with a **modular, domain-driven architecture** that mirrors how production engineering teams structure services:

```
src/
├── app/
│   ├── config/          # Environment validation, Redis setup
│   ├── middlewares/     # Request validation, error handling
│   ├── modules/
│   │   └── apod/        # Self-contained domain module
│   │       ├── apod.controller.ts   # HTTP layer — req/res only
│   │       ├── apod.service.ts      # Business logic
│   │       ├── apod.route.ts        # Route definitions
│   │       ├── apod.interface.ts    # TypeScript contracts
│   │       ├── apod.validation.ts   # Zod schemas
│   │       └── apod.test.ts         # Integration tests
│   └── route/           # Root router aggregation
├── app.ts               # Express app setup
└── server.ts            # Entry point
```

Each module is fully self-contained. Adding a new data domain (say, Mars weather data) means adding a new folder — nothing else changes. This matters for maintainability and for clearly communicating architectural intent.

---

## Chapter 2: The Caching Layer — Making NASA Fast

Redis sits between the service and NASA. The strategy is simple but powerful:

```ts
// apod.service.ts
const cacheKey = `apod:${targetDate}`;

// Check cache first
const cachedData = await redisClient.get(cacheKey);
if (cachedData) {
  logger.info(`🎯 Cache Hit for APOD: ${targetDate}`);
  return { data: JSON.parse(cachedData), source: "cache" };
}

// Miss: call NASA, then store for 24 hours
const response = await axios.get(NASA_APOD_URL, { params: { date, api_key } });
await redisClient.set(cacheKey, JSON.stringify(enrichedData), { EX: 86400 });
```

The cache key is scoped by date (`apod:2025-01-15`), so each day's image is stored independently. First request of the day: hits NASA. Every request after: hits Redis at sub-millisecond speeds. The response even tells the client whether data came from cache or API, useful for debugging and instrumentation.

---

## Chapter 3: Filtering Videos Before They Reach the User

NASA's APOD sometimes returns YouTube video embeds instead of images. `media_type: "video"`. In a new-tab extension context, a video is genuinely harmful to the user experience — slow to load, potentially autoplaying audio, platform network costs.

The filter happens here, in the service, before any data leaves the server:

```ts
// getRandomApod() — fetch 5, keep only the first image
while (attempts < 3) {
  const response = await axios.get(NASA_APOD_URL, { params: { count: 5 } });
  const items = Array.isArray(response.data) ? response.data : [response.data];

  const imageItem = items.find(item => item.media_type === "image");
  if (imageItem) return { data: imageItem, source: "api" };

  attempts++;
  logger.warn("No image found in random APOD fetch, retrying...");
}
```

Requesting 5 at a time and filtering client-side (server-side from the extension's perspective) gives overwhelmingly good odds of finding an image immediately. The retry loop with `attempts < 3` is a final safety valve. In practice, the first batch always contains at least one image.

---

## Chapter 4: Production Hardening — Built Secure from Day One

Security and reliability weren't retrofitted — they were part of the initial setup:

```ts
// app.ts
app.use(helmet());                             // Security headers
app.use(cors({ origin: allowedOrigins }));     // Strict origin control
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })); // 100 req/15min
```

**Structured logging with Pino**: instead of `console.log`, every event is a structured JSON log with level, timestamp, and context. In production, these pipe directly into log aggregation services (Datadog, Loki, CloudWatch) without any additional configuration.

```ts
logger.info(`🎯 Cache Hit for APOD: ${targetDate}`);
logger.warn("No image found in random APOD fetch, retrying...");
logger.error(err, "Redis fetch error");
```

**Zod for environment validation**: the server refuses to start if any required environment variable is missing or malformed. No runtime surprises from a misconfigured deployment.

```ts
// config/env.ts
const envSchema = z.object({
  NASA_API_KEY: z.string().min(1),
  REDIS_URL: z.string().url(),
  PORT: z.coerce.number().default(5000),
});
export const env = envSchema.parse(process.env); // throws on invalid
```

---

## Chapter 5: Testing & CI

Integration tests cover the full request lifecycle — routing, service logic, and response structure — using Vitest and Supertest:

```ts
// apod.test.ts
describe('GET /api/v1/apod/random', () => {
  it('should return a random image (not video)', async () => {
    const res = await request(app).get('/api/v1/apod/random');
    expect(res.status).toBe(200);
    expect(res.body.data.media_type).toBe('image');
  });
});
```

A GitHub Actions CI pipeline (`/.github/workflows/ci.yml`) runs lint and tests on every push, ensuring the build never silently breaks.

---

## Technology Stack

| Tool | Role | Why |
|---|---|---|
| **Bun** | Runtime | Significantly faster than Node.js for startup and execution |
| **Express** | HTTP Framework | Battle-tested, minimal, full TypeScript support |
| **TypeScript** | Language | Strict typing prevents entire classes of runtime bugs |
| **Redis** | Cache | Sub-millisecond reads; perfect for time-bound API responses |
| **Zod** | Validation | Type-safe env config and request schema validation |
| **Pino** | Logging | Structured JSON logs, production-ready out of the box |
| **Helmet** | Security | Automatic HTTP security headers |
| **express-rate-limit** | Security | Abuse prevention |
| **Vitest + Supertest** | Testing | Integration-level test coverage |
| **GitHub Actions** | CI/CD | Automated lint + test on every push |

---

## Running Locally

```bash
# 1. Install dependencies
bun install

# 2. Set up environment
cp .env.example .env
# Fill in: NASA_API_KEY, REDIS_URL, PORT

# 3. Start Redis (if not already running)
docker run -d -p 6379:6379 redis:alpine

# 4. Start the development server
bun run dev
# → Server running at http://localhost:5000
```

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/apod` | Today's Astronomical Picture of the Day |
| `GET` | `/api/v1/apod?date=YYYY-MM-DD` | APOD for a specific date |
| `GET` | `/api/v1/apod/random` | Random image APOD (videos filtered out) |
| `GET` | `/health` | Server health check |

### Example Response

```json
{
  "success": true,
  "message": "Cosmic data retrieved successfully",
  "source": "cache",
  "data": {
    "date": "2024-03-15",
    "title": "The Andromeda Galaxy",
    "explanation": "...",
    "url": "https://apod.nasa.gov/apod/image/...",
    "media_type": "image",
    "object_type": "Galaxy",
    "more_info_url": "https://simbad.u-strasbg.fr/..."
  }
}
```

---

## Roadmap

- [x] Modular domain-driven architecture
- [x] Redis caching (24hr TTL per date)
- [x] Random endpoint with video filtering
- [x] Zod environment validation
- [x] Structured Pino logging
- [x] Security hardening (Helmet, CORS, rate limiting)
- [x] Integration tests with Vitest + Supertest
- [x] GitHub Actions CI pipeline
- [ ] Response compression (gzip)
- [ ] Prometheus metrics endpoint

---

## License

MIT — Built by [tarekul42](https://github.com/tarekul42)
