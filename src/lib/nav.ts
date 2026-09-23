import type { DomainId, DomainMeta } from "./types";
import { DOMAINS } from "./domains";

/** Intent clusters — keeps primary nav to ~6 items (NN/g: avoid tab overflow). */
export interface DomainCluster {
  id: string;
  label: string;
  labelNp: string;
  blurb: string;
  accent: string;
  domainIds: DomainId[];
}

export const DOMAIN_CLUSTERS: DomainCluster[] = [
  {
    id: "society",
    label: "Society",
    labelNp: "समाज",
    blurb: "People, health, learning, migration",
    accent: "#3DDC97",
    domainIds: ["people", "health", "education", "migration"],
  },
  {
    id: "markets",
    label: "Markets",
    labelNp: "बजार",
    blurb: "Economy, government, food systems",
    accent: "#F4D35E",
    domainIds: ["economy", "government", "agriculture"],
  },
  {
    id: "planet",
    label: "Planet",
    labelNp: "पृथ्वी",
    blurb: "Climate, hazards, energy",
    accent: "#2EC4B6",
    domainIds: ["environment", "disasters", "energy"],
  },
  {
    id: "motion",
    label: "Motion",
    labelNp: "गति",
    blurb: "Travel, roads, digital rails",
    accent: "#4CC9F0",
    domainIds: ["tourism", "transport", "digital"],
  },
];

/** Standalone top-level destinations (not inside a cluster menu). */
export const NAV_PINS: DomainId[] = ["places", "news"];

export function domainsInCluster(cluster: DomainCluster): DomainMeta[] {
  return cluster.domainIds
    .map((id) => DOMAINS.find((d) => d.id === id))
    .filter((d): d is DomainMeta => Boolean(d));
}

export function clusterForPath(pathname: string): DomainCluster | null {
  const domain = DOMAINS.find((d) => d.href === pathname);
  if (!domain) return null;
  return (
    DOMAIN_CLUSTERS.find((c) => c.domainIds.includes(domain.id)) ?? null
  );
}
