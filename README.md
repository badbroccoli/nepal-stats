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

## Status

Planning complete. Implementation not started — see Phase 0 in the technical plan.
