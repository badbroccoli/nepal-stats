# NepalStats

One-stop dark dashboard for Nepal: national pulse, interactive district map, live FX / earthquakes / news, and curated metrics across people, economy, government, health, education, energy, environment, tourism, digital, transport, agriculture, and migration.

## Quick start

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional: set `WAQI_TOKEN` for live Kathmandu AQI.

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

## Stack

Next.js · MapLibre · Recharts · TypeScript · Tailwind
