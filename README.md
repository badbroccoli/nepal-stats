# WorldStats

One-stop dark dashboard for **every country**: national pulse, interactive map, live FX / earthquakes / news, head of state & cabinet with portraits, and World Bank metrics with trend charts across people, economy, government, health, education, energy, environment, tourism, digital, transport, agriculture, and migration.

Home lists ~197 countries with flags. Click any nation to open a dynamically generated dashboard at `/[country]` — no per-country static pages.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel)

Import this GitHub repo. Leave **Root Directory** empty (app is at the repo root).

## Routes

| Path | What you get |
|------|----------------|
| `/` | Country grid with flags, search, region filters |
| `/[country]` | National pulse (KPIs, map, news, FX, hazards) |
| `/[country]/[domain]` | Domain page (metrics + charts, or map / news / government) |
| Legacy `/people`, `/economy`, … | Redirects to `/np/...` for old bookmarks |

Examples: `/us`, `/fr/government`, `/jp/economy`, `/br/places`.

## Live connectors

| Feed | Source |
|------|--------|
| Population (preferred) | National NSO / Eurostat when available → else World Bank |
| Domain indicators & charts | World Bank (+ national portals listed per country) |
| Earthquakes | USGS (country bounding box) |
| FX | Frankfurter / ECB |
| News | Google News RSS |
| Leadership & cabinet | Wikidata + Wikipedia |
| Map basemap | OpenFreeMap / MapLibre |

### Official source registry

Every country has a curated list of **federal / national** statistical offices, central banks, open-data portals, and (where known) census / health / hazard agencies in `src/data/country-sources.json`.

- Pulse and domain pages show an **Official data sources** panel with deep links.
- Population prefers Eurostat for EU/EEA (and similar) geos; optional `CENSUS_API_KEY` enables live U.S. Census ACS totals.
- `GET /api/sources?country=fr` returns the registry; add `&probe=1` to HEAD/GET-check agency URLs.

World Bank remains the cross-country baseline because it is itself compiled from national statistical systems when a machine-readable national API is not yet wired.

### API

| Endpoint | Notes |
|----------|--------|
| `GET /api/pulse?country=us` | Aggregate pulse payload |
| `GET /api/news?country=fr` | Headlines |
| `GET /api/metrics/[domain]?country=jp` | Domain KPIs |
| `GET /api/sources?country=de` | Official agency registry (`&probe=1` optional) |
| `GET /api/earthquakes?country=us` | USGS helper |
| `GET /api/forex?currency=EUR` | FX helper |

Optional env: `CENSUS_API_KEY` for live U.S. Census ACS population.

## Stack

Next.js · MapLibre · Recharts · TypeScript · Tailwind

## Security

This app is designed to run with a **public** codebase:

- No secrets required for core feeds
- Security headers and `poweredByHeader: false` in `next.config.ts`
- Light in-process rate limiting on `/api/*` (`src/proxy.ts`)
- Shared `Cache-Control` helpers on API routes (`src/lib/http.ts`)
- CI lint/build, CodeQL, and Dependabot configs under `.github/`

Report vulnerabilities privately — see [SECURITY.md](SECURITY.md).
