import type { DomainId, DomainMeta } from "./types";
import { countryPath } from "./countries";

const DOMAIN_DEFS: Omit<DomainMeta, "href">[] = [
  {
    id: "people",
    title: "People & Society",
    titleNp: "Population, vitals, literacy",
    blurb: "Population, vitals, literacy, HDI",
    accent: "#3DDC97",
  },
  {
    id: "economy",
    title: "Economy & Markets",
    titleNp: "GDP, FX, remittance, markets",
    blurb: "GDP, FX, remittance, markets, CPI",
    accent: "#F4D35E",
  },
  {
    id: "government",
    title: "Government & Finance",
    titleNp: "Leadership, budget, fiscal",
    blurb: "Leadership, budget, fiscal transfers",
    accent: "#E8A87C",
  },
  {
    id: "health",
    title: "Health",
    titleNp: "Facilities, mortality, care",
    blurb: "Facilities, mortality, immunization",
    accent: "#41B3A3",
  },
  {
    id: "education",
    title: "Education",
    titleNp: "Schools, enrollment, outcomes",
    blurb: "Schools, enrollment, outcomes",
    accent: "#7BDFF2",
  },
  {
    id: "energy",
    title: "Energy & Infrastructure",
    titleNp: "Power, electrification, fuel",
    blurb: "Power capacity, electrification, fuel",
    accent: "#FF9F1C",
  },
  {
    id: "environment",
    title: "Environment & Climate",
    titleNp: "Climate, forests, emissions",
    blurb: "AQI, climate, forests, rivers",
    accent: "#2EC4B6",
  },
  {
    id: "disasters",
    title: "Disasters & Safety",
    titleNp: "Earthquakes and hazard feeds",
    blurb: "Earthquakes, floods, and hazard feeds",
    accent: "#FF6B6B",
  },
  {
    id: "tourism",
    title: "Tourism & Culture",
    titleNp: "Arrivals and travel income",
    blurb: "Arrivals, hotels, travel income",
    accent: "#CDB4DB",
  },
  {
    id: "digital",
    title: "Connectivity & Digital",
    titleNp: "Mobile, broadband, internet",
    blurb: "Mobile, broadband, bandwidth",
    accent: "#4CC9F0",
  },
  {
    id: "transport",
    title: "Transport & Mobility",
    titleNp: "Aviation and mobility",
    blurb: "Vehicles, aviation, mobility",
    accent: "#90BE6D",
  },
  {
    id: "agriculture",
    title: "Agriculture & Food",
    titleNp: "Cereals, livestock, food",
    blurb: "Cereals, livestock, food prices",
    accent: "#B5E48C",
  },
  {
    id: "migration",
    title: "Labor & Migration",
    titleNp: "Migration and remittance",
    blurb: "Outflows, destinations, remittance",
    accent: "#F72585",
  },
  {
    id: "places",
    title: "Places",
    titleNp: "Interactive national map",
    blurb: "Interactive national map",
    accent: "#A0C4FF",
  },
  {
    id: "news",
    title: "News & Calendar",
    titleNp: "Headlines",
    blurb: "Headlines and release calendar",
    accent: "#FFB703",
  },
];

export const DOMAINS: DomainMeta[] = DOMAIN_DEFS.map((d) => ({
  ...d,
  href: countryPath("us", d.id),
}));

export function domainsFor(countryCode: string): DomainMeta[] {
  return DOMAIN_DEFS.map((d) => ({
    ...d,
    href: countryPath(countryCode, d.id),
  }));
}

export function isDomainId(value: string): value is DomainId {
  return DOMAIN_DEFS.some((d) => d.id === value);
}

/** Kept for legacy Nepal district map components still in the tree. */
export const PROVINCE_NAMES: Record<number, { en: string; np: string }> = {
  1: { en: "Koshi", np: "कोशी" },
  2: { en: "Madhesh", np: "मधेश" },
  3: { en: "Bagmati", np: "बागमती" },
  4: { en: "Gandaki", np: "गण्डकी" },
  5: { en: "Lumbini", np: "लुम्बिनी" },
  6: { en: "Karnali", np: "कर्णाली" },
  7: { en: "Sudurpashchim", np: "सुदूरपश्चिम" },
};
