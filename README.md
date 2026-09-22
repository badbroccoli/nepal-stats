# NepalStats

One-stop dark dashboard for Nepal: national pulse, interactive district map, live FX / earthquakes / news, and curated metrics across people, economy, government, health, education, energy, environment, tourism, digital, transport, agriculture, and migration.

## Quick start

```bash
cd web
npm install
cp .env.example .env.local   # optional
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional: set `WAQI_TOKEN` in `.env.local` for live Kathmandu AQI (server-only; never commit it).

## Live connectors

| Feed | Endpoint |
|------|----------|
| Pulse aggregate | `GET /api/pulse` |
| News RSS | `GET /api/news` |
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

- No secrets in git history; optional `WAQI_TOKEN` is server-only via env
- Security headers and `poweredByHeader: false` in `web/next.config.ts`
- Light in-process rate limiting on `/api/*` (`web/src/proxy.ts`)
- Shared `Cache-Control` helpers on API routes (`web/src/lib/http.ts`)
- CI lint/build, CodeQL, and Dependabot configs under `.github/`

Report vulnerabilities privately — see [SECURITY.md](SECURITY.md) (`me@hemanta.com`).

### Owner checklist (GitHub security settings)

The agent token cannot change org security settings. An org admin / owner should enable:

1. **Secret scanning + push protection** — Settings → Code security → enable Secret scanning and Push protection.
2. **Dependabot alerts** — Settings → Code security → enable Dependabot alerts (and optionally Dependabot security updates).
3. **Branch protection** on `main` — Settings → Branches → require status checks (`Lint & build` / CodeQL as available), and disallow force pushes.
4. Confirm `WAQI_TOKEN` (if used) exists only as a host / Actions secret, never in the repo.

## Cloud Agent environment

`.cursor/environment.json` installs `web/` deps and starts the Next.js dev server.
