# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nuba AI** is a bilingual (Arabic-primary) web application providing accessibility services: text/audio translation, image description for the visually impaired, and an AI chat assistant. The app is Arabic-RTL with full support for multiple languages.

## Repository Structure

```
nuba-ai/
├── backend/          # Node.js/Express API server
├── src/              # React/TypeScript frontend (CRA)
├── public/
├── agent/            # Agent persona config (YAML + markdown rules)
├── docker-compose.yml
├── render.yaml       # Render.com deployment config
└── nginx.conf
```

## Commands

### Frontend (run from `/nuba-ai`)
```bash
npm start          # Dev server on http://localhost:3000
npm run build      # Production build
npm test           # Run tests (watch mode)
npm test -- --watchAll=false  # Run tests once (CI)
```

### Backend (run from `/nuba-ai/backend`)
```bash
npm run dev        # Dev with nodemon (auto-reload)
npm start          # Production start
```

### Docker (run from `/nuba-ai`)
```bash
docker-compose up --build   # Full stack with MongoDB
docker-compose down
```

## Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB Atlas URI |
| `JWT_SECRET` | Yes | Min 32 chars |
| `GROQ_API_KEY` | Yes | Powers translation, vision, chat |
| `ALLOWED_ORIGINS` | Yes | Comma-separated frontend URLs |
| `GOOGLE_CLIENT_ID` | No | Enables Google OAuth |
| `GROQ_MODEL` | No | Default: `llama-3.3-70b-versatile` |
| `GROQ_VISION_MODEL` | No | Default: `llama-3.2-11b-vision-preview` |

### Frontend (`src/.env` or build args)
| Variable | Notes |
|---|---|
| `REACT_APP_API_URL` | Backend URL; defaults to `http://localhost:5000` |

## Architecture

### Backend (Express + MongoDB)

All API routes are under `/api/*` with per-route rate limiting applied in `server.js`:
- `/api/auth` — 20 req/15min
- `/api/translate` — 30 req/min
- `/api/vision` — 10 req/min
- `/api/chat` — 30 req/min

**Route → Controller → Groq SDK** pattern:
- `routes/` define Express routers and apply `middleware/auth.js` (JWT verification)
- `controllers/` contain all business logic; each feature uses Groq SDK directly (no shared service layer)
- `models/User.js` — email/password or Google OAuth users; password field is optional
- `models/Subscription.js` — PayPal subscription tracking (status lifecycle: APPROVAL_PENDING → ACTIVE → CANCELLED/EXPIRED)

Auth flow: JWT tokens with 7-day expiry, stored on client. Google OAuth verifies via `google-auth-library` and merges accounts by email.

### Frontend (React + TypeScript + MUI)

**State management:** Single `AuthContext` (`src/context/AuthContext.tsx`) holds user/token; persists to `localStorage`. All pages consume it via `useAuth()`.

**Routing:** All non-auth routes are wrapped in `ProtectedRoute` which redirects to `/login` if unauthenticated.

Pages:
- `/` — Home/welcome
- `/translate` — Text translation (8 languages via Groq)
- `/blind-assist` — Image upload → base64 → vision description
- `/chat` — Conversational AI assistant (Arabic-first, 20-message context window)

API calls use `axios` with the base URL from `REACT_APP_API_URL`. The `Authorization: Bearer <token>` header is set per-request in each page component.

### AI Features (all via Groq SDK)

- **Translation:** `llama-3.3-70b-versatile`, temp 0.1, max 2000 chars input
- **Vision/Blind Assist:** `llama-3.2-11b-vision-preview`, images sent as base64 data URLs, max 4MB
- **Chat:** `llama-3.3-70b-versatile`, temp 0.7, system prompt in `chatController.js` defines the Nuba assistant persona

### Deployment

- **Docker Compose:** Mongo + backend + nginx-served frontend
- **Render.com:** Backend on free tier (port 10000); frontend deployed separately (Vercel/Netlify); `render.yaml` at repo root
