# Nepal Real-Time Statistics Dashboard

Technical planning and architecture for a dark-themed, map-centric national dashboard covering population, disasters, district drill-downs, and a curated Nepali news feed.

## Documents

| Doc | Description |
|-----|-------------|
| [docs/TECHNICAL_PLAN.md](docs/TECHNICAL_PLAN.md) | Full implementation plan: features, architecture, stack, phases |
| [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) | Living register of APIs, cadences, and compliance notes |

## Recommended stack (summary)

- **Frontend:** Next.js + TypeScript, MapLibre GL, Tailwind (dark theme)
- **Backend:** NestJS/Fastify, BullMQ workers, Socket.IO
- **Data:** PostgreSQL + PostGIS, Redis
- **Sources:** NSO CKAN, BIPAD, USGS, NRB Forex, Nepali RSS

## Lean MVP app

A runnable, self-contained lean MVP of the dashboard now lives at the repo root (Next.js 15 + TypeScript + Tailwind + MapLibre GL). It needs no database, Redis, or secrets: server-side route handlers poll public sources and fall back to bundled fixtures (flagged as `cached`) when a source is unreachable.

### Run locally

```bash
npm ci
npm run dev      # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck`.

### What works today

- **National KPIs** — population + crude birth rate (World Bank), USD→NPR (Nepal Rastra Bank), 24h earthquake count (USGS). Every metric shows its source, as-of time, and freshness label.
- **Interactive map** — dark MapLibre map of Nepal's 75 districts (bundled GeoJSON, no map token) with hover, click-to-drill-down, and live USGS earthquake markers.
- **News rail** — deduplicated headlines from Nepali RSS feeds (OnlineKhabar, Ratopati).

### API surface

| Route | Purpose |
|-------|---------|
| `GET /api/v1/kpis/national` | Headline metrics + freshness |
| `GET /api/v1/disasters?sinceHours=` | USGS earthquakes near Nepal |
| `GET /api/v1/news` | Curated, deduplicated RSS feed |
| `GET /api/v1/geo/districts` | District boundaries (GeoJSON) |

### Attribution

Earthquakes © USGS (public domain) · FX © Nepal Rastra Bank · Population/CBR © World Bank · District boundaries © [geoJSON-Nepal](https://github.com/mesaugat/geoJSON-Nepal) · Headlines link out to their source outlets.

## Status

Planning complete. Lean MVP (Phase 0 foundations + slices of Phases 1–3) scaffolded and running — see `docs/TECHNICAL_PLAN.md` for the full roadmap and remaining phases (PostGIS/Redis, BIPAD connectors, WebSocket fan-out, population estimate model).
