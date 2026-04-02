# 🌌 Space Image of the Day — Chrome Extension

A professional, immersive browser extension that displays **NASA's Astronomy Picture of the Day (APOD)** every time you open a new tab. Enriched with astronomical metadata from **SIMBAD** and featuring a high-end glassmorphism UI.

Built with the **MERN Stack** (MongoDB, Express.js, React, Node.js) and bundled with **Vite**.

![Architecture](https://img.shields.io/badge/Architecture-MERN-purple)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Features

- **Immersive Full-Screen UI**: High-resolution cosmic backgrounds with radial overlays for maximum visual impact.
- **Hero Discovery Title**: Prominent, attractive typography with interactive hover effects and glassmorphism.
- **"Next Discovery"**: Explore NASA's entire historical archive with one click—fetch random cosmic wonders instantly.
- **Astronomical Enrichment**: Automatically identifies object types (Galaxy, Nebula, etc.) and constellations via SIMBAD and smart text inference.
- **Slide-out Info Panel**: A sophisticated glassmorphism panel providing deep cosmic context without cluttering the view.
- **Zero-Config Database**: Uses an in-memory MongoDB server by default for instant setup.
- **Responsive Design**: Adapts beautifully to different screen sizes.

---

## 🏗️ Project Structure

```
space-image-of-the-day/
├── server/                 # Modular MVC Backend
│   ├── config/             # Global configurations (DB, etc.)
│   ├── middleware/         # Global middleware (Error handler, Auth, etc.)
│   ├── modules/            # Feature-based modules
│   │   ├── apod/           # APOD Feature Module
│   │   │   ├── apod.controller.js
│   │   │   ├── apod.model.js
│   │   │   ├── apod.route.js
│   │   │   └── apod.service.js
│   │   └── health/         # Health Check Module
│   │       ├── health.controller.js
│   │       └── health.route.js
│   └── utils/              # Shared utility functions (NASA API, SIMBAD)
├── extension/              # Chrome Extension Source
│   ├── public/             # Static assets (manifest, icons)
│   ├── src/                # React source code (JSX, CSS)
│   ├── index.html          # Extension entry page
│   └── vite.config.js      # Vite build configuration
├── .env.example            # Environment template
├── package.json            # Main project configuration
└── README.md               # Documentation
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Optional: Add your `NASA_API_KEY` for higher rate limits)*

### 3. Run in Development

This starts both the backend server and the Vite development server for the extension:
```bash
npm run dev
```

### 4. Build and Load Extension

To use it in your browser:
1. Build the extension:
   ```bash
   npm run build
   ```
2. Open Chrome/Brave and go to `chrome://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the `extension/dist` folder.

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/apod` | GET | Get today's featured image |
| `/api/apod/random` | GET | Fetch a random cosmic discovery from NASA |
| `/api/apod/history` | GET | View previously discovered images |

---

## 🛠️ Technologies

- **Backend**: Node.js, Express, Mongoose, node-fetch
- **Frontend**: React 18, Vite, Vanilla CSS (Glassmorphism)
- **Database**: MongoDB (In-memory or Local)
- **Data Sources**: NASA APOD API, SIMBAD Astronomical Database

---

## 📝 License

MIT — Created by [tarekul42](https://github.com/tarekul42)
