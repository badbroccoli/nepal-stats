import type { DomainId, DomainMeta } from "./types";
import { countryPath } from "./countries";

const DOMAIN_DEFS: Omit<DomainMeta, "href">[] = [
  {
    id: "people",
    title: "People & Society",
    titleNp: "जनसंख्या",
    blurb: "Population, vitals, literacy, HDI",
    accent: "#3DDC97",
  },
  {
    id: "economy",
    title: "Economy & Markets",
    titleNp: "अर्थतन्त्र",
    blurb: "GDP, FX, remittance, markets, CPI",
    accent: "#F4D35E",
  },
  {
    id: "government",
    title: "Government & Finance",
    titleNp: "सरकार",
    blurb: "Leadership, budget, fiscal transfers",
    accent: "#E8A87C",
  },
  {
    id: "health",
    title: "Health",
    titleNp: "स्वास्थ्य",
    blurb: "Facilities, mortality, immunization",
    accent: "#41B3A3",
  },
  {
    id: "education",
    title: "Education",
    titleNp: "शिक्षा",
    blurb: "Schools, enrollment, outcomes",
    accent: "#7BDFF2",
  },
  {
    id: "energy",
    title: "Energy & Infrastructure",
    titleNp: "ऊर्जा",
    blurb: "Power capacity, electrification, fuel",
    accent: "#FF9F1C",
  },
  {
    id: "environment",
    title: "Environment & Climate",
    titleNp: "वातावरण",
    blurb: "AQI, climate, forests, rivers",
    accent: "#2EC4B6",
  },
  {
    id: "disasters",
    title: "Disasters & Safety",
    titleNp: "प्रकोप",
    blurb: "Earthquakes, floods, and hazard feeds",
    accent: "#FF6B6B",
  },
  {
    id: "tourism",
    title: "Tourism & Culture",
    titleNp: "पर्यटन",
    blurb: "Arrivals, hotels, travel income",
    accent: "#CDB4DB",
  },
  {
    id: "digital",
    title: "Connectivity & Digital",
    titleNp: "डिजिटल",
    blurb: "Mobile, broadband, bandwidth",
    accent: "#4CC9F0",
  },
  {
    id: "transport",
    title: "Transport & Mobility",
    titleNp: "यातायात",
    blurb: "Vehicles, aviation, mobility",
    accent: "#90BE6D",
  },
  {
    id: "agriculture",
    title: "Agriculture & Food",
    titleNp: "कृषि",
    blurb: "Cereals, livestock, food prices",
    accent: "#B5E48C",
  },
  {
    id: "migration",
    title: "Labor & Migration",
    titleNp: "वैदेशिक रोजगार",
    blurb: "Outflows, destinations, remittance",
    accent: "#F72585",
  },
  {
    id: "places",
    title: "Places",
    titleNp: "स्थानहरू",
    blurb: "Interactive national map",
    accent: "#A0C4FF",
  },
  {
    id: "news",
    title: "News & Calendar",
    titleNp: "समाचार",
    blurb: "Headlines and release calendar",
    accent: "#FFB703",
  },
];

/** Absolute domain list (hrefs default to Nepal for legacy callers). */
export const DOMAINS: DomainMeta[] = DOMAIN_DEFS.map((d) => ({
  ...d,
  href: countryPath("np", d.id),
}));

export function domainsFor(countryCode: string): DomainMeta[] {
  const isNepal = countryCode.toLowerCase() === "np";
  return DOMAIN_DEFS.map((d) => ({
    ...d,
    // Keep Nepali subtitles for Nepal; elsewhere use the English blurb.
    titleNp: isNepal ? d.titleNp : d.blurb,
    href: countryPath(countryCode, d.id),
  }));
}

export function isDomainId(value: string): value is DomainId {
  return DOMAIN_DEFS.some((d) => d.id === value);
}

export const PROVINCE_NAMES: Record<number, { en: string; np: string }> = {
  1: { en: "Koshi", np: "कोशी" },
  2: { en: "Madhesh", np: "मधेश" },
  3: { en: "Bagmati", np: "बागमती" },
  4: { en: "Gandaki", np: "गण्डकी" },
  5: { en: "Lumbini", np: "लुम्बिनी" },
  6: { en: "Karnali", np: "कर्णाली" },
  7: { en: "Sudurpashchim", np: "सुदूरपश्चिम" },
};
