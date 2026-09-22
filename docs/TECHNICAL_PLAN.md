# Nepal Real-Time Statistics Dashboard — Technical Implementation Plan

## 1. Executive summary

Build a dark-themed, map-centric **one-stop Nepal hub**: national pulse KPIs, interactive place drill-down, near-real-time hazards, markets/macro, sector deep-dives (health, education, tourism, energy, digital, migration), and a curated Nepali news stream. Because most Nepal government sources publish on schedules rather than true push streams, treat “real-time” as **low-latency polling + WebSocket fan-out**, with clear freshness metadata on every metric.

The full metric inventory (beyond demography/disasters) lives in [`docs/METRICS_CATALOG.md`](./METRICS_CATALOG.md).

---

## 2. Product scope

### 2.1 Core features (MVP)

| Feature | Behavior |
|--------|----------|
| National pulse strip | Population estimate, FX, CPI/inflation, remittance, NEPSE headline, AQI, disaster counts |
| Sectioned exploration | People, Economy, Government, Health, Education, Energy, Environment, Tourism, Digital, Transport, Agriculture, Migration |
| Interactive Nepal map | Zoomable vector map (provinces → districts → local levels), multi-layer choropleth + drill-down |
| Disaster + environment layers | Earthquakes, BIPAD incidents, river/rain, city AQI |
| News + calendar rail | Nepali RSS headlines + economic/holiday calendar |
| Dark data UI | Black/graphite base, high-contrast charts, bilingual labels (EN / नेपाली) |

### 2.2 Explicit non-goals (MVP)

- Claiming second-by-second official census counters (NSO does not publish that)
- Scraping paywalled full-text articles (RSS titles + links only)
- Offline GIS editing or municipal CRM workflows
- Replacing official ministry portals (we aggregate + link out with attribution)

### 2.3 One-stop metric domains (summary)

See **[`METRICS_CATALOG.md`](./METRICS_CATALOG.md)** for the full list. Priority bands:

| Band | Domains |
|------|---------|
| **MVP pulse** | People, Economy (FX/CPI/remittance/reserves/trade), Disasters, AQI, News, Tourism arrivals, NEPSE index |
| **v2 depth** | Health facilities & MoHP KPIs, Education IEMIS, NTA telecom, Public finance (MoF/FCGO), Kitchen prices |
| **v3 breadth** | Energy mix, Migration/DoFE, Agriculture, Transport/EV, full local-level metric coverage |

---

## 3. Data sources research & recommendations

### 3.1 Population, births, demographics

| Source | What you get | Freshness | Integration notes |
|--------|--------------|-----------|-------------------|
| **NSO Nepal Open Data (CKAN)** — [data.nsonepal.gov.np](https://data.nsonepal.gov.np) | Census/survey tables via CKAN Action API (`package_search`, `datastore_search`) | Periodic (census, surveys) | Primary **official** source for district/local breakdowns |
| **NPHC 2021 census downloads** — [censusresults.nsonepal.gov.np](https://censusresults.nsonepal.gov.np/downloads/census-dataset) | Households, population by sex/age, local levels | Static baseline | Seed DB; join to GeoJSON admin codes |
| **World Bank Indicators API** — `SP.POP.TOTL` for `NPL` | Annual national population | Yearly | Good cross-check / national headline number |
| **UN World Population Prospects** | Births, CBR, life expectancy | Yearly | Use for birth/death **rates** and projection curves |

**Population “ticker” strategy (honest UX):**

1. Load last official census + annual mid-year estimate.
2. Derive a **display estimate** with a documented model, e.g.  
   `P(t) = P0 * e^(r * Δt)` using UN crude rates, or linear interpolation between published years.
3. Always show **as-of date**, **source**, and **confidence** (official vs estimated).

Do **not** present interpolated counters as NSO live data.

### 3.2 Natural disasters & hazards

| Source | What you get | Freshness | Integration notes |
|--------|--------------|-----------|-------------------|
| **BIPAD Portal API** — [bipadportal.gov.np/api](https://bipadportal.gov.np/api/) / [v1 docs](https://bipadportal.gov.np/api/v1/) | Incidents, damage/loss, realtime hydrology (rainfall, river), alerts | Minutes–hours | **Primary Nepal DRM feed** (NDRRMA). Prefer REST poll + cache; respect ToS/rate limits |
| **USGS FDSN Event API** — [earthquake.usgs.gov](https://earthquake.usgs.gov/fdsnws/event/1/) | Earthquakes as GeoJSON | Near real-time | Filter bbox around Nepal (~26–31°N, 80–89°E); also use GeoJSON feeds for low latency |
| **DHM (dhm.gov.np)** | Weather / flood products | Mixed | Limited public API; prefer BIPAD realtime module over scraping DHM HTML |

**BIPAD modules of interest:** Dashboard alerts, Incident reporting (police-fed), Realtime (rain/river/air/fire), Risk Info.

### 3.3 Economy, finance, markets & cross-sector hubs

| Source | Metric | Notes |
|--------|--------|-------|
| **Nepal Rastra Bank Forex API** — `https://www.nrb.org.np/api/forex/v1/` | Daily NPR buy/sell rates | Cache aggressively (business-day cadence) |
| **NRB Current Macroeconomic Situation** (monthly/annual PDF + tables) | CPI, remittance, reserves, BoP, trade | Parse published tables; primary macro spine |
| **MoF data portal** — [data.mof.gov.np](http://data.mof.gov.np/) | Growth, revenue, monetary, external, inflation | Chart/data pages for fiscal/real sector |
| **World Bank Nepal Fiscal Dashboard** | Federal/provincial/local revenue, expenditure, transfers | Best-in-class federalism finance UX to emulate + cite |
| **National Data Portal** — [nationaldata.gov.np](https://nationaldata.gov.np/) | Health, tourism, water/energy, civil registration, social security | Cross-ministry catalog for many v2 metrics |
| **Open Data Nepal** — [opendatanepal.com](https://opendatanepal.com/) | Mixed open datasets + API | Good discovery layer |
| **NSO national accounts / CKAN** | GDP and structural stats | Batch ingest |
| **NEPSE / lawful market APIs** | Index, turnover, movers | Prefer licensed/ToS-safe APIs; never scrape in violation |
| **NTA MIS reports** | Mobile/broadband penetration | Periodic PDF/tables → structured ingest |
| **NEA / DoED** | Generation, capacity, electrification | Annual/operational reports |
| **NTB / MoCTCA** | Tourist arrivals | Monthly releases |
| **CEHRD IEMIS / Flash reports** | Schools, enrollment | Annual academic flash |
| **MoHP HMIS / National Data Portal health** | Facilities, mortality, disease | Mix of portal + publications |
| **WAQI / OpenAQ** | City AQI / PM2.5 | True RT environment KPI |
| **DoFE / MoLESS** | Labor migration outflows | Migration module |
| **DoTM** | Vehicle / EV registrations | Transport module |

### 3.4 Geospatial boundaries

Prefer open, post-federal-restructure boundaries (7 provinces, 77 districts, ~753–755 local levels):

| Dataset | Use |
|---------|-----|
| [LocalBoundaries (OKNP)](https://localboundries.oknp.org/) | GeoJSON / TopoJSON / Shapefile downloads |
| [nepali-geo-pro-max](https://github.com/l3lackcurtains/nepali-geo-pro-max) | Bundled GeoJSON + helpers; **official chuche boundary** (incl. Kalapani area) |
| [open-admin-data/nepal-administrative-divisions](https://github.com/open-admin-data/nepal-administrative-divisions) | Bilingual names, codes, hierarchy API |

**Recommendation:** Ship **TopoJSON** (smaller) for provinces/districts in the client; lazy-load local-level polygons on district drill-down. Store stable `admin_code` keys that match NSO/BIPAD joins.

### 3.5 Nepali news feed

Most outlets expose **RSS**, not commercial APIs:

| Outlet | Approach |
|--------|----------|
| OnlineKhabar | `onlinekhabar.com/feed` (verified RSS pattern) |
| Nagarik / Republica | `nagariknews.nagariknetwork.com/feed` |
| The Himalayan Times | Site RSS directory |
| Kantipur, Setopati, Ratopati, Gorkhapatra | RSS where available; otherwise **do not scrape** full HTML for MVP |

**Aggregator rules:** server-side fetch only, title/summary/link/image, dedupe by URL + fuzzy title, tag by province keywords, cache 2–5 minutes, attribute source + link out (copyright-safe).

Optional enrichment: NewsAPI / GNews with `country=np` for English wires — secondary, not a substitute for local portals.

### 3.6 Feasibility matrix

| Need | Feasible as true RT? | Recommended approach |
|------|----------------------|----------------------|
| Population | No (official) | Estimate + label |
| Births | No | Annual rates + optional hospital pilots later |
| Earthquakes | Yes | USGS WebSocket-like poll (15–60s) |
| Floods/rain | Near-RT | BIPAD realtime poll (1–5 min) |
| Incidents | Near-RT | BIPAD incidents poll |
| FX | Daily | NRB once/day + cache |
| News | Near-RT | RSS poll 2–5 min |

---

## 4. Recommended tech stack

### 4.1 Frontend

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 15 (App Router) + TypeScript** | SSR for SEO, API routes/BFF, React 19 |
| UI | **Tailwind CSS + shadcn/ui** | Fast dark theme; avoid purple-default kits — custom CSS variables |
| Charts | **Apache ECharts** or **Visx** | Dense dark dashboards; ECharts stronger for maps+gauges |
| Map | **MapLibre GL JS** + vector tiles **or** deck.gl + GeoJSON | Free, performant; Mapbox-compatible without Mapbox lock-in |
| State / RT | **TanStack Query** + **Socket.IO client** (or native WebSocket) | Cache + live invalidation |
| i18n | **next-intl** | EN / नेपाली |

**Map library pick:** Start with **MapLibre + TopoJSON/GeoJSON layers** for district choropleths and click handlers. Add vector tiles (Tippecanoe → PMTiles) if local-level zoom becomes heavy.

### 4.2 Backend / ingestion

| Layer | Choice | Why |
|-------|--------|-----|
| API | **NestJS** or **Fastify + TypeScript** | Structured modules, WebSockets gateway |
| Jobs | **BullMQ + Redis** | Scheduled polls, retries, backoff |
| Realtime fan-out | **Socket.IO** or **ws** on API | Push metric deltas to browsers |
| DB | **PostgreSQL 16 + PostGIS** | Admin joins, spatial queries |
| Cache | **Redis** | Hot KPIs, news, rate-limit tokens |
| Object storage | **S3-compatible** | Geo assets, snapshots |
| Optional stream | **NATS** or Kafka | Only if multi-service scale needs it |

**Alternative lean MVP:** Next.js API routes + Redis + a single worker process (simpler ops). Graduate to NestJS when connectors multiply.

### 4.3 Infra

| Concern | Recommendation |
|---------|----------------|
| Hosting | Vercel/Cloudflare (frontend) + Fly.io/Railway/AWS ECS (API + workers) |
| Secrets | Doppler / AWS Secrets Manager |
| Observability | OpenTelemetry + Grafana / Axiom |
| CI | GitHub Actions — lint, typecheck, e2e smoke |

---

## 5. System architecture

```text
┌─────────────────────────────────────────────────────────────┐
│  Clients (Next.js dark dashboard + MapLibre)                │
│  REST (initial hydrate)  ·  WebSocket (deltas)              │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  BFF / API Gateway                                          │
│  Auth (optional) · rate limits · schema validation          │
└───────┬─────────────────────────────┬───────────────────────┘
        │                             │
┌───────▼────────┐           ┌────────▼────────┐
│  Metrics API   │           │  Realtime Hub   │
│  /kpis /admin  │           │  WS rooms:      │
│  /news /geo    │           │  national,      │
└───────┬────────┘           │  province:{id}  │
        │                    └────────▲────────┘
┌───────▼────────────────────────────────────────┐
│  PostgreSQL + PostGIS     Redis (hot cache)    │
└───────▲────────────────────────────────────────┘
        │
┌───────┴────────────────────────────────────────┐
│  Ingestion workers (BullMQ)                    │
│  · nso-ckan · bipad · usgs · nrb · rss-news    │
│  normalize → validate → upsert → publish event │
└───────┬────────────────────────────────────────┘
        │
   External sources (NSO, BIPAD, USGS, NRB, RSS)
```

### 5.1 Data flow patterns

1. **Hydrate:** Client loads `/api/v1/dashboard` (KPIs + map summary + news).
2. **Subscribe:** Client opens WS room `national` (and `district:{code}` on drill-down).
3. **Ingest:** Workers poll sources on cadence → write Postgres → bump Redis → emit `metric.updated`.
4. **Stale-while-revalidate:** UI shows last good value + `updatedAt` if upstream fails.

### 5.2 Canonical event schema (example)

```json
{
  "type": "metric.updated",
  "metric": "earthquake.event",
  "adminLevel": "national",
  "adminCode": "NP",
  "value": { "mag": 4.2, "lat": 27.7, "lon": 85.3, "place": "Nepal" },
  "source": "usgs",
  "observedAt": "2026-09-22T08:41:00Z",
  "ingestedAt": "2026-09-22T08:41:12Z"
}
```

---

## 6. Domain model (core tables)

- `admin_unit` — code, name_en, name_np, level (`province|district|local`), parent_code, geom
- `metric_definition` — key, unit, description, cadence, source
- `metric_observation` — metric_key, admin_code, value_json, observed_at, source, confidence
- `disaster_event` — type, severity, geom/point, admin_code, raw_payload, source_id (unique)
- `news_item` — url (unique), title, summary, source, lang, published_at, tags[]
- `ingestion_run` — connector, started_at, status, rows, error

Use PostGIS `GIST` on geometries; unique indexes on `(source, source_id)` for disasters and `url` for news.

---

## 7. UI/UX architecture (dark theme)

### 7.1 Layout

```text
┌──────────────────────────────────────────────────────────┐
│  Brand / Nepal Stats          EN|ने  · last updated       │
├──────────────┬─────────────────────────────┬─────────────┤
│  KPI column  │     Full-bleed MapLibre     │  News rail  │
│  pop/births  │     Nepal centered          │  live feed  │
│  disasters   │     zoom + drill panel      │             │
│  FX          │                             │             │
└──────────────┴─────────────────────────────┴─────────────┘
```

- **Black background** (`#050505`–`#0B0B0B`), graphite panels, muted borders — not purple gradients.
- Map is the **visual center**; KPIs and news are supporting rails.
- Drill-down: click district → slide-over with local KPIs + recent incidents + filtered news.
- Motion: map flyTo on select, KPI count-up, news list enter — 2–3 intentional motions max.

### 7.2 Accessibility

- WCAG AA contrast on charts/text
- Keyboard focus on map regions via list sibling
- Reduced-motion preference disables fly animations

---

## 8. API surface (MVP)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/kpis/national` | Headline metrics + freshness |
| GET | `/api/v1/admin/{code}/stats` | Drill-down stats |
| GET | `/api/v1/geo/{level}` | TopoJSON/GeoJSON (+ metric join keys) |
| GET | `/api/v1/disasters` | Filtered events (bbox, since, type) |
| GET | `/api/v1/news` | Paginated curated feed |
| WS | `/realtime` | Subscribe rooms; receive `metric.updated` |

Version all public contracts; include `Cache-Control` and `ETag` on geo payloads.

---

## 9. Ingestion cadences

| Connector | Interval | Notes |
|-----------|----------|-------|
| USGS earthquakes | 30–60s | Bbox Nepal; dedupe by event id |
| BIPAD realtime | 1–5 min | River/rain stations |
| BIPAD incidents | 2–5 min | Map to admin codes |
| RSS news | 2–5 min | Parallel fetch, timeout 8s |
| NRB forex | 1h (or 6h) | Only changes on business days |
| NSO / World Bank | Daily–weekly | Batch refresh |

Circuit breakers: after N failures, cool down and serve cache; alert on Slack/PagerDuty.

---

## 10. Implementation phases

### Phase 0 — Foundations (scaffold)

- Monorepo or `apps/web` + `apps/api` + `packages/shared`
- Postgres + PostGIS + Redis locally (Docker Compose)
- Dark shell UI + empty MapLibre Nepal view
- CI lint/typecheck

### Phase 1 — Map + static stats

- Load province/district TopoJSON
- Choropleth from NPHC 2021 population
- District drill-down panel
- Source attribution footer

### Phase 2 — Near-real-time hazards

- USGS connector + map markers
- BIPAD incidents/realtime connectors
- WebSocket fan-out for new events
- National disaster KPI counters

### Phase 3 — National pulse (one-stop MVP)

- Population estimate ticker + age/density map layers
- NRB FX + CPI/remittance/reserves cards (from macro releases)
- Tourism arrivals + AQI stations
- NEPSE headline (lawful feed only)
- RSS aggregator with dedupe and bilingual tags
- Section nav shell for future domains (even if some are “coming soon”)

### Phase 4 — Sector depth (v2)

- Health, Education, Telecom, Public finance, Kitchen prices connectors
- Shared `metric_definition` registry driven by `METRICS_CATALOG.md`
- District comparison mode (“Bagmati vs Gandaki”)

### Phase 5 — Hardening & breadth (v3)

- Energy, migration, agriculture, transport/EV
- Rate limits, robots/ToS compliance review
- Observability, SLO dashboards, PMTiles + CDN geo caching
- Crisis layout mode (flood/quake/epidemic KPI reorder)

---

## 11. Suggested repository structure

```text
apps/
  web/                 # Next.js dashboard
  api/                 # NestJS/Fastify API + WS
  worker/              # BullMQ ingestion workers
packages/
  shared/              # Zod schemas, metric keys, admin codes
  geo/                 # TopoJSON assets + build scripts
infra/
  docker-compose.yml
  migrations/          # Flyway or Drizzle/Prisma migrations
docs/
  TECHNICAL_PLAN.md    # this document
  DATA_SOURCES.md      # living source register
```

---

## 12. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Government APIs change / lack SLAs | Adapter pattern per connector; snapshot fixtures in tests |
| “Real-time population” expectation mismatch | Clear labeling: Estimated vs Official |
| Heavy local-level GeoJSON | Progressive disclosure + PMTiles |
| RSS ToS / scraping ethics | Titles+links only; respect robots; cache |
| BIPAD auth/rate limits | Conservative polling; contact NDRRMA for partnership if scaling |
| Boundary disputes / map politics | Use GoN chuche boundary datasets; document choice |

---

## 13. Success metrics

- Time-to-interactive map < 3s on broadband
- Earthquake marker latency < 90s from USGS publish (p95)
- News freshness < 5 minutes (p95)
- 99% API availability for cached KPI endpoints
- Every metric shows source + `updatedAt`

---

## 14. Immediate next build steps

1. Scaffold Next.js + API + Docker Compose (PostGIS, Redis).
2. Import district TopoJSON and render dark MapLibre choropleth.
3. Implement USGS + one BIPAD endpoint connector end-to-end.
4. Add WebSocket broadcast and news RSS aggregator.
5. Document each connector in `docs/DATA_SOURCES.md` with license and cadence.

---

## Appendix A — Key endpoints (reference)

```text
# NSO CKAN
https://data.nsonepal.gov.np/api/3/action/package_search
https://data.nsonepal.gov.np/api/3/action/datastore_search?resource_id=...

# World Bank population
https://api.worldbank.org/v2/country/npl/indicator/SP.POP.TOTL?format=json

# NRB forex
https://www.nrb.org.np/api/forex/v1/rates?from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&per_page=100

# USGS Nepal bbox (example)
https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=26&maxlatitude=31&minlongitude=80&maxlongitude=89&orderby=time

# BIPAD
https://bipadportal.gov.np/api/
https://bipadportal.gov.np/api/v1/
```

## Appendix B — License / compliance checklist

- [ ] Attribute NSO, NDRRMA/BIPAD, USGS, NRB, and each news outlet
- [ ] Confirm GeoJSON dataset licenses (OKNP / package LICENSE)
- [ ] No verbatim copyrighted article bodies in UI or DB
- [ ] Publish methodology page for population estimates
- [ ] Rate-limit outbound crawlers; identify User-Agent
