# NepalStats

One-stop dark dashboard for Nepal: national pulse, interactive district map, live FX / natural disasters / news, and curated metrics across people, economy, government, health, education, energy, environment, tourism, digital, transport, agriculture, and migration.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional: set `WAQI_TOKEN` in `.env.local` for live Kathmandu AQI (server-only; never commit it).

## Deploy (Vercel)

Import this GitHub repo. Leave **Root Directory** empty (app is at the repo root). Add `WAQI_TOKEN` if desired.

## Live connectors

| Feed | Endpoint |
|------|----------|
| Pulse aggregate | `GET /api/pulse` |
| News RSS | `GET /api/news` |
| Natural disasters (BIPAD + USGS) | `GET /api/disasters` |
| USGS quakes | `GET /api/earthquakes` |
| NRB forex | `GET /api/forex` |
| Domain metrics | `GET /api/metrics/[domain]` |
| District GeoJSON | `GET /api/geo/districts` |

## Docs

- [Technical plan](docs/TECHNICAL_PLAN.md)
- [Metrics catalog](docs/METRICS_CATALOG.md)
- [Data sources](docs/DATA_SOURCES.md)
- [Security policy](SECURITY.md)

## Stack

Next.js · MapLibre · Recharts · TypeScript · Tailwind

## Security

This app is designed to run with a **public** codebase:

- No secrets in git; optional `WAQI_TOKEN` is server-only via env
- Security headers and `poweredByHeader: false` in `next.config.ts`
- Light in-process rate limiting on `/api/*` (`src/proxy.ts`)
- Shared `Cache-Control` helpers on API routes (`src/lib/http.ts`)
- CI lint/build, CodeQL, and Dependabot configs under `.github/`

Report vulnerabilities privately — see [SECURITY.md](SECURITY.md) (`me@hemanta.com`).

### Owner checklist (GitHub security settings)

An org admin / owner should enable:

1. **Secret scanning + push protection** — Settings → Code security
2. **Dependabot alerts** — Settings → Code security
3. **Branch protection** on `main` — require status checks (`Lint & build` / CodeQL), disallow force pushes
4. Confirm `WAQI_TOKEN` (if used) exists only as a host / Actions secret
