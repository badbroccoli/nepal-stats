import type { DisasterEvent, NewsItem } from "./types";

/**
 * Offline fallback fixtures. These are only served when an upstream source is
 * unreachable, and every response that uses them is flagged `stale: true` so the
 * UI can label the data as a cached snapshot rather than live official data.
 */

export const FALLBACK_POPULATION = {
  value: 29164578,
  year: 2021,
};

export const FALLBACK_CBR = 19.9;

export const FALLBACK_FOREX_USD = 133.15;

export const FALLBACK_EARTHQUAKES: DisasterEvent[] = [
  {
    id: "fixture-eq-1",
    type: "earthquake",
    magnitude: 4.6,
    depthKm: 10,
    place: "12 km SE of Jumla, Nepal",
    lat: 29.2,
    lon: 82.3,
    observedAt: "2026-09-22T05:12:00Z",
    url: "https://earthquake.usgs.gov/",
  },
  {
    id: "fixture-eq-2",
    type: "earthquake",
    magnitude: 3.9,
    depthKm: 15,
    place: "Bajhang region, Nepal",
    lat: 29.9,
    lon: 81.2,
    observedAt: "2026-09-22T03:41:00Z",
    url: "https://earthquake.usgs.gov/",
  },
  {
    id: "fixture-eq-3",
    type: "earthquake",
    magnitude: 5.1,
    depthKm: 22,
    place: "Sindhupalchok, Nepal",
    lat: 27.9,
    lon: 85.7,
    observedAt: "2026-09-21T21:08:00Z",
    url: "https://earthquake.usgs.gov/",
  },
];

export const FALLBACK_NEWS: NewsItem[] = [
  {
    id: "fixture-news-1",
    title: "Sample headline: Kathmandu air quality improves after rainfall",
    link: "https://www.onlinekhabar.com/",
    source: "OnlineKhabar",
    publishedAt: "2026-09-22T04:30:00Z",
    summary: "Cached sample item shown when live RSS feeds are unreachable.",
  },
  {
    id: "fixture-news-2",
    title: "Sample headline: NRB updates daily reference exchange rates",
    link: "https://www.nrb.org.np/",
    source: "Nepal Rastra Bank",
    publishedAt: "2026-09-22T02:00:00Z",
    summary: "Cached sample item shown when live RSS feeds are unreachable.",
  },
];
