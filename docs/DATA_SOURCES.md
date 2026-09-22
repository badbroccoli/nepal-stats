# Data Sources Register

Living inventory of upstream feeds for the Nepal Real-Time Statistics Dashboard.  
Update this file whenever a connector is added, broken, or re-licensed.

| ID | Domain | Provider | Endpoint / access | Cadence | Auth | License / notes | Status |
|----|--------|----------|-------------------|---------|------|-----------------|--------|
| `nso-ckan` | Stats | National Statistics Office | `https://data.nsonepal.gov.np/api/3` | Daily–weekly poll | None (public) | Government open data; attribute NSO | Planned |
| `nphc-2021` | Population baseline | NSO census results | [census dataset downloads](https://censusresults.nsonepal.gov.np/downloads/census-dataset) | One-time seed + rare updates | Download | Official census; join on admin codes | Planned |
| `wb-pop` | Population national | World Bank | `https://api.worldbank.org/v2/country/npl/indicator/SP.POP.TOTL?format=json` | Weekly | None | World Bank terms | Planned |
| `un-wpp` | Birth/death rates | UN WPP | Manual / published tables | Annual | None | Cite UN DESA | Planned |
| `bipad-api` | Disasters / hydrology | NDRRMA BIPAD | `https://bipadportal.gov.np/api/` · `https://bipadportal.gov.np/api/v1/` | 1–5 min | Confirm if keys needed | Government DRM portal; polite rate limits | Planned |
| `usgs-eq` | Earthquakes | USGS | FDSN Event API + GeoJSON feeds | 30–60s | None | Public domain USGS | Planned |
| `nrb-fx` | FX rates | Nepal Rastra Bank | `https://www.nrb.org.np/api/forex/v1/rates` | Hourly check / daily change | None | Official NRB; cache hard | Planned |
| `geo-oknp` | Boundaries | LocalBoundaries / OKNP | [localboundries.oknp.org](https://localboundries.oknp.org/) | Static assets | Download | Confirm license on download | Planned |
| `geo-chuche` | Boundaries | nepali-geo-pro-max | GitHub package GeoJSON | Static | npm/git | Prefer GoN chuche boundary | Planned |
| `rss-onlinekhabar` | News | OnlineKhabar | `https://www.onlinekhabar.com/feed` | 2–5 min | None | Titles + links only | Planned |
| `rss-nagarik` | News | Nagarik | `https://nagariknews.nagariknetwork.com/feed` | 2–5 min | None | Titles + links only | Planned |
| `rss-himalayan` | News | The Himalayan Times | Site RSS directory | 2–5 min | None | Titles + links only | Planned |
| `rss-setopati` | News | Setopati | RSS if available | 2–5 min | None | Skip if no lawful feed | Planned |
| `rss-kantipur` | News | Kantipur | RSS if available | 2–5 min | None | Skip if no lawful feed | Planned |

## Connector checklist (per source)

1. Document rate limits and User-Agent.
2. Store raw payload samples under `fixtures/` (sanitized).
3. Normalize to shared Zod schemas in `packages/shared`.
4. Persist `source`, `source_id`, `observed_at`, `ingested_at`.
5. Surface attribution in the UI footer / metric tooltip.
