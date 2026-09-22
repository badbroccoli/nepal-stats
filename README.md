# Nepal Real-Time Statistics Dashboard

Planning for a dark-themed, map-centric **one-stop hub for everything Nepal**: people, economy, government finance, health, education, energy, environment, disasters, tourism, digital, transport, agriculture, migration, places, and news.

## Documents

| Doc | Description |
|-----|-------------|
| [docs/TECHNICAL_PLAN.md](docs/TECHNICAL_PLAN.md) | Architecture, stack, ingestion, phased delivery |
| [docs/METRICS_CATALOG.md](docs/METRICS_CATALOG.md) | Expanded metric inventory (Worldometers / Trading Economics–style) |
| [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) | Living register of APIs, cadences, and compliance notes |

## Recommended stack (summary)

- **Frontend:** Next.js + TypeScript, MapLibre GL, Tailwind (dark theme)
- **Backend:** NestJS/Fastify, BullMQ workers, Socket.IO
- **Data:** PostgreSQL + PostGIS, Redis
- **Sources:** NSO, National Data Portal, NRB, MoF, BIPAD, USGS, NTA, NTB, WAQI, Nepali RSS, and more

## Status

Planning in progress. Implementation not started — see phases in the technical plan.
