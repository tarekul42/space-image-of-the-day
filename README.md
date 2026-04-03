# 🌌 Space Image of the Day — Premium Chrome Extension

A professional, production-ready browser extension that transforms your new tabs into an immersive celestial discovery experience. This project bridges the gap between high-performance backends and cutting-edge frontend design.

![Architecture](https://img.shields.io/badge/Architecture-Modular-blue)
![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Tailwind%20v4-blueviolet)
![Backend](https://img.shields.io/badge/Backend-Bun%20%2B%20Redis-red)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Professional Features

- **Component-Based Architecture**: Follows industry-standard Atomic Design for the extension and a modular, domain-driven structure for the server.
- **Premium Cosmic UI**: Optimized with **Glassmorphism**, high-resolution media handling, and the **Outfit** typeface for a modern astronomical aesthetic.
- **Intelligent Caching**: Powered by **Redis** for sub-millisecond response times for frequently accessed NASA data.
- **Micro-Animations**: Smooth, performant transitions using **Framer Motion** for a luxurious user experience.
- **Zero-Config Service Worker**: Optionally connects to a local backend for enhanced features while maintaining a zero-config fallback.
- **Robust Observability**: Integrated with structured logging (**Pino**) and health monitoring.

---

## 🏗️ Technology Stack

### 🔹 Backend (Server)
- **Runtime**: [Bun](https://bun.sh) (High-performance JS runtime)
- **Framework**: Express (Node.js/TypeScript)
- **Caching**: [Redis](https://redis.io/) (Data persistence and high-speed delivery)
- **Validation**: [Zod](https://zod.dev/) (Strict type-safety for env and API data)
- **Security**: Helmet, Express-Rate-Limit, CORS

### 🔹 Extension (Frontend)
- **Framework**: React 19 (Latest stable)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: Context API (Domain-divided)

---

## 🚀 Installation & Build

### 1. Backend Setup
```bash
# Navigate to server
cd server

# Install dependencies using Bun
bun install

# Start development server
bun run dev
```

### 2. Extension Setup
```bash
# From the root directory
bun install

# Build the extension for Chrome/Edge
bun run extension:build
```

---

## 📝 Roadmap
- [x] Refactor to Modular Architecture (Backend)
- [x] Implement Atomic Design System (Extension)
- [x] Integrate Redis Caching for NASA API
- [x] Premium Glassmorphism UI Implementation
- [ ] Multi-lingual Cosmic Explanations
- [ ] Interactive Astronomer's Star Map

---

## 📄 License

MIT — Architected & Designed by [tarekul42](https://github.com/tarekul42)
