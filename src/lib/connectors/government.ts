import { cachedFetch } from "./cache";

export type CabinetMember = {
  name: string;
  nameNp?: string;
  role: string;
  party: string;
  bio: string;
  /** Featured leader vs cabinet minister */
  tier: "pm" | "minister";
  photo?: string;
};

export type GovMember = CabinetMember & {
  wikipediaUrl?: string;
  source: "wikidata" | "wikipedia";
};

export type CountryGovernment = {
  asOf: string;
  headOfState: GovMember | null;
  headOfGovernment: GovMember | null;
  ministers: GovMember[];
  sourceNote: string;
};

const UA =
  "WorldStatsDashboard/1.0 (https://github.com/badbroccoli/nepal-stats; national-pulse)";

type WdEntity = {
  id: string;
  labels?: Record<string, { value: string }>;
  descriptions?: Record<string, { value: string }>;
  claims?: Record<string, WdClaim[]>;
  sitelinks?: Record<string, { title: string }>;
};

type WdClaim = {
  rank?: string;
  mainsnak?: {
    datavalue?: {
      value?: string | { id?: string; time?: string };
    };
  };
  qualifiers?: Record<string, unknown[]>;
};

type SparqlBinding = Record<string, { value: string }>;

function commonsThumb(fileNameOrUrl: string, width = 320): string {
  if (fileNameOrUrl.startsWith("http")) {
    if (fileNameOrUrl.includes("Special:FilePath")) {
      return `${fileNameOrUrl}${fileNameOrUrl.includes("?") ? "&" : "?"}width=${width}`;
    }
    return fileNameOrUrl;
  }
  const encoded = encodeURIComponent(fileNameOrUrl.replace(/ /g, "_"));
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=${width}`;
}

function bestEntityIds(entity: WdEntity, prop: string): string[] {
  const claims = entity.claims?.[prop] ?? [];
  const preferred = claims.filter((c) => c.rank === "preferred");
  const normal = claims.filter((c) => c.rank === "normal");
  const pool = preferred.length ? preferred : normal;
  const out: string[] = [];
  for (const c of pool) {
    if (c.qualifiers?.P582) continue;
    const v = c.mainsnak?.datavalue?.value;
    if (v && typeof v === "object" && "id" in v && v.id) out.push(v.id);
  }
  return out;
}

function bestString(entity: WdEntity, prop: string): string | null {
  const claims = entity.claims?.[prop] ?? [];
  const preferred = claims.filter((c) => c.rank === "preferred");
  const pool = preferred.length ? preferred : claims;
  for (const c of pool) {
    if (c.qualifiers?.P582) continue;
    const v = c.mainsnak?.datavalue?.value;
    if (typeof v === "string" && v) return v;
  }
  return null;
}

async function wdGetEntities(ids: string[]): Promise<Record<string, WdEntity>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return {};
  const out: Record<string, WdEntity> = {};
  for (let i = 0; i < unique.length; i += 40) {
    const chunk = unique.slice(i, i + 40);
    const url = new URL("https://www.wikidata.org/w/api.php");
    url.searchParams.set("action", "wbgetentities");
    url.searchParams.set("ids", chunk.join("|"));
    url.searchParams.set("props", "labels|descriptions|claims|sitelinks");
    url.searchParams.set("languages", "en");
    url.searchParams.set("format", "json");
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) continue;
    const json = (await res.json()) as { entities?: Record<string, WdEntity> };
    Object.assign(out, json.entities ?? {});
  }
  return out;
}

async function resolveCountryEntity(
  iso2: string,
  name: string,
): Promise<WdEntity | null> {
  const searchUrl = new URL("https://www.wikidata.org/w/api.php");
  searchUrl.searchParams.set("action", "query");
  searchUrl.searchParams.set("list", "search");
  searchUrl.searchParams.set(
    "srsearch",
    `haswbstatement:P297=${iso2.toUpperCase()}`,
  );
  searchUrl.searchParams.set("srnamespace", "0");
  searchUrl.searchParams.set("srlimit", "1");
  searchUrl.searchParams.set("format", "json");

  try {
    const searchRes = await fetch(searchUrl, {
      headers: { "User-Agent": UA },
      next: { revalidate: 86400 },
    });
    if (searchRes.ok) {
      const sjson = (await searchRes.json()) as {
        query?: { search?: Array<{ title: string }> };
      };
      const title = sjson.query?.search?.[0]?.title;
      if (title?.startsWith("Q")) {
        const ents = await wdGetEntities([title]);
        return ents[title] ?? null;
      }
    }
  } catch {
    // fall through
  }

  const url = new URL("https://www.wikidata.org/w/api.php");
  url.searchParams.set("action", "wbgetentities");
  url.searchParams.set("sites", "enwiki");
  url.searchParams.set("titles", name);
  url.searchParams.set("props", "labels|descriptions|claims|sitelinks");
  url.searchParams.set("languages", "en");
  url.searchParams.set("format", "json");
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { entities?: Record<string, WdEntity> };
  const ent = Object.values(json.entities ?? {}).find(
    (e) => e.id && !("missing" in e),
  );
  return ent ?? null;
}

async function wikiSummary(title: string): Promise<{
  extract: string;
  thumbnail?: string;
  url: string;
} | null> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      extract?: string;
      thumbnail?: { source?: string };
      content_urls?: { desktop?: { page?: string } };
      type?: string;
    };
    if (json.type === "disambiguation") return null;
    return {
      extract: (json.extract ?? "").trim(),
      thumbnail: json.thumbnail?.source,
      url:
        json.content_urls?.desktop?.page ??
        `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    };
  } catch {
    return null;
  }
}

function clipBio(text: string, max = 420): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

async function personToMember(
  entity: WdEntity,
  role: string,
  tier: "pm" | "minister",
  enrichWiki: boolean,
): Promise<GovMember | null> {
  const name =
    entity.labels?.en?.value ||
    entity.sitelinks?.enwiki?.title?.replace(/_/g, " ");
  if (!name) return null;

  const wikiTitle = entity.sitelinks?.enwiki?.title;
  const summary =
    enrichWiki && wikiTitle ? await wikiSummary(wikiTitle) : null;
  const desc = entity.descriptions?.en?.value ?? "";
  const imageFile = bestString(entity, "P18");
  const photo =
    summary?.thumbnail ||
    (imageFile ? commonsThumb(imageFile) : undefined);

  const bio = clipBio(
    summary?.extract || desc || `${name} currently serves as ${role}.`,
  );

  return {
    name,
    role,
    party: "",
    bio,
    tier,
    photo,
    wikipediaUrl: summary?.url
      ? summary.url
      : wikiTitle
        ? `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiTitle)}`
        : undefined,
    source: "wikidata",
  };
}

async function wikiFindCabinetPages(
  countryName: string,
  headName?: string | null,
): Promise<string[]> {
  const queries = [
    headName ? `${headName} cabinet` : null,
    headName ? `Second cabinet of ${headName}` : null,
    headName ? `${headName} ministry` : null,
    headName ? `${headName} government` : null,
    `Cabinet of ${countryName}`,
    `${countryName} cabinet`,
  ].filter(Boolean) as string[];

  const titles: string[] = [];
  const seen = new Set<string>();

  for (const q of queries) {
    const url = new URL("https://en.wikipedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("list", "search");
    url.searchParams.set("srsearch", q);
    url.searchParams.set("srlimit", "8");
    url.searchParams.set("format", "json");
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA },
        next: { revalidate: 86400 },
      });
      if (!res.ok) continue;
      const json = (await res.json()) as {
        query?: { search?: Array<{ title: string }> };
      };
      for (const hit of json.query?.search ?? []) {
        const t = hit.title;
        if (seen.has(t)) continue;
        if (/^List of/i.test(t)) continue;
        if (/shadow cabinet/i.test(t)) continue;
        if (/federal executive departments/i.test(t)) continue;
        if (
          !/cabinet|ministry|government|administration|council of ministers/i.test(
            t,
          )
        ) {
          continue;
        }
        seen.add(t);
        titles.push(t);
      }
    } catch {
      // try next query
    }
  }

  // Score: prefer titled cabinets that include a person name or ordinal ("Second …")
  const headToken = headName?.split(/\s+/).pop()?.toLowerCase() ?? "";
  titles.sort((a, b) => scoreCabinetTitle(b, headToken) - scoreCabinetTitle(a, headToken));
  return titles.slice(0, 5);
}

function scoreCabinetTitle(title: string, headToken: string): number {
  let s = 0;
  if (/^(first|second|third|fourth|fifth)\b/i.test(title)) s += 5;
  if (headToken && title.toLowerCase().includes(headToken)) s += 6;
  if (/ministry|council of ministers/i.test(title)) s += 3;
  if (/^cabinet of /i.test(title)) s += 1;
  if (/history|list|shadow/i.test(title)) s -= 5;
  return s;
}

async function wikiParseCabinetMembers(pageTitle: string): Promise<
  Array<{ name: string; role: string; wikiTitle: string }>
> {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", pageTitle);
  url.searchParams.set("prop", "text");
  url.searchParams.set("format", "json");
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      parse?: { text?: { ["*"]?: string } };
    };
    const html = json.parse?.text?.["*"] ?? "";
    if (!html) return [];

    const decode = (s: string) =>
      s
        .replace(/&amp;/g, "&")
        .replace(/&#8211;/g, "–")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    const out: Array<{ name: string; role: string; wikiTitle: string }> = [];
    const seen = new Set<string>();

    const re =
      /<td[^>]*>\s*<a[^>]+title="([^"]+)"[^>]*>[^<]+<\/a>\s*<\/td>\s*<td[^>]*(?:font-weight:\s*bold)?[^>]*>\s*(?:<b>)?\s*<a href="\/wiki\/([^"]+)"[^>]*title="([^"]+)"[^>]*>/gi;

    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const role = decode(m[1] ?? "");
      const slug = m[2] ?? "";
      const name = decode(m[3] ?? "");
      if (!role || !name || !slug) continue;
      if (/^(Flag|Seal|Coat|File|Category):/i.test(slug)) continue;
      if (
        /list of|election|constitution|congress|parliament|committee|senate|house of|assembly|legislature/i.test(
          role,
        )
      ) {
        continue;
      }
      if (/committee|senate|house_of/i.test(slug)) continue;
      // Person pages rarely start with United_States_Secretary — that's an office
      if (/^(United_States_|Secretary_of|Minister_of|Ministry_of)/i.test(slug))
        continue;

      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ name, role, wikiTitle: slug });
      if (out.length >= 30) break;
    }
    return out;
  } catch {
    return [];
  }
}

async function fetchWikipediaCabinet(
  countryName: string,
  headName?: string | null,
): Promise<GovMember[]> {
  const pages = await wikiFindCabinetPages(countryName, headName);
  let bestRows: Array<{ name: string; role: string; wikiTitle: string }> = [];
  let usedPage = "";

  for (const page of pages) {
    const rows = await wikiParseCabinetMembers(page);
    if (rows.length > bestRows.length) {
      bestRows = rows;
      usedPage = page;
    }
    // Good enough
    if (bestRows.length >= 8) break;
  }

  if (!bestRows.length) return [];
  void usedPage;

  const ministers: GovMember[] = [];
  for (let i = 0; i < bestRows.length; i++) {
    const row = bestRows[i]!;
    const summary =
      i < 16 ? await wikiSummary(row.wikiTitle.replace(/_/g, " ")) : null;
    ministers.push({
      name: row.name.replace(/ \(.*\)$/, ""),
      role: row.role,
      party: "",
      bio: clipBio(
        summary?.extract ||
          `${row.name} serves as ${row.role} in the government of ${countryName}.`,
      ),
      tier: "minister",
      photo: summary?.thumbnail,
      wikipediaUrl:
        summary?.url ??
        `https://en.wikipedia.org/wiki/${encodeURIComponent(row.wikiTitle)}`,
      source: "wikidata",
    });
  }
  return ministers;
}

async function sparqlCabinet(iso2: string): Promise<
  Array<{ qid: string; name: string; role: string; image?: string; desc?: string }>
> {
  const iso = iso2.toUpperCase();
  const queries = [
    // 1) Ministers linked to the country's executive body
    `
SELECT DISTINCT ?person ?name ?role ?image ?desc WHERE {
  ?country wdt:P297 "${iso}" .
  ?country wdt:P208 ?gov .
  ?person p:P39 ?st .
  ?st ps:P39 ?position ; a wikibase:BestRank .
  FILTER NOT EXISTS { ?st pq:P582 ?end }
  ?position wdt:P361 ?gov .
  ?person rdfs:label ?name FILTER(LANG(?name) = "en")
  ?position rdfs:label ?role FILTER(LANG(?role) = "en")
  OPTIONAL { ?person wdt:P18 ?image }
  OPTIONAL { ?person schema:description ?desc FILTER(LANG(?desc) = "en") }
}
LIMIT 30`.trim(),
    // 2) Fallback: current holders of minister-class offices for the country
    `
SELECT DISTINCT ?person ?name ?role ?image ?desc WHERE {
  ?country wdt:P297 "${iso}" .
  ?person p:P39 ?st .
  ?st ps:P39 ?position ; a wikibase:BestRank .
  FILTER NOT EXISTS { ?st pq:P582 ?end }
  ?position wdt:P1001 ?country .
  ?position wdt:P279* wd:Q83307 .
  ?person rdfs:label ?name FILTER(LANG(?name) = "en")
  ?position rdfs:label ?role FILTER(LANG(?role) = "en")
  OPTIONAL { ?person wdt:P18 ?image }
  OPTIONAL { ?person schema:description ?desc FILTER(LANG(?desc) = "en") }
}
LIMIT 30`.trim(),
  ];

  for (const query of queries) {
    const rows = await runSparql(query);
    if (rows.length >= 3) return rows;
    if (rows.length > 0) {
      // Keep partial; try fallback to merge
      const extra = await runSparql(queries[1]!);
      const seen = new Set(rows.map((r) => r.qid));
      for (const r of extra) {
        if (!seen.has(r.qid)) {
          seen.add(r.qid);
          rows.push(r);
        }
      }
      return rows;
    }
  }
  return [];
}

async function runSparql(query: string): Promise<
  Array<{ qid: string; name: string; role: string; image?: string; desc?: string }>
> {
  const url = new URL("https://query.wikidata.org/sparql");
  url.searchParams.set("format", "json");
  url.searchParams.set("query", query);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 18_000);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "application/sparql-results+json",
      },
      signal: controller.signal,
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      results?: { bindings?: SparqlBinding[] };
    };
    const rows = json.results?.bindings ?? [];
    const seen = new Set<string>();
    const out: Array<{
      qid: string;
      name: string;
      role: string;
      image?: string;
      desc?: string;
    }> = [];
    for (const b of rows) {
      const personUri = b.person?.value ?? "";
      const qid = personUri.split("/").pop() ?? "";
      const name = b.name?.value;
      const role = b.role?.value;
      if (!qid || !name || !role) continue;
      if (seen.has(qid)) continue;
      seen.add(qid);
      out.push({
        qid,
        name,
        role,
        image: b.image?.value,
        desc: b.desc?.value,
      });
    }
    return out;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function emptyGovernment(note: string): CountryGovernment {
  return {
    asOf: new Date().toISOString().slice(0, 10),
    headOfState: null,
    headOfGovernment: null,
    ministers: [],
    sourceNote: note,
  };
}

export async function fetchCountryGovernment(
  iso2: string,
  countryName: string,
): Promise<CountryGovernment> {
  const code = iso2.toLowerCase();
  return cachedFetch(`gov-v5-${code}`, 6 * 60 * 60 * 1000, () =>
    fetchLiveGovernment(code, countryName),
  ).catch(() =>
    emptyGovernment("Government roster temporarily unavailable."),
  );
}

async function fetchLeadersOnly(
  iso2: string,
  countryName: string,
): Promise<Pick<CountryGovernment, "headOfState" | "headOfGovernment">> {
  const country = await resolveCountryEntity(iso2, countryName);
  if (!country) return { headOfState: null, headOfGovernment: null };

  const hosIds = bestEntityIds(country, "P35");
  const hogIds = bestEntityIds(country, "P6");
  const ents = await wdGetEntities([...new Set([...hosIds, ...hogIds])]);

  let headOfState: GovMember | null = null;
  let headOfGovernment: GovMember | null = null;

  if (hosIds[0] && ents[hosIds[0]]) {
    headOfState = await personToMember(
      ents[hosIds[0]],
      "Head of state",
      "pm",
      true,
    );
  }
  if (hogIds[0] && ents[hogIds[0]]) {
    const same = hosIds[0] === hogIds[0];
    headOfGovernment = await personToMember(
      ents[hogIds[0]],
      same ? "Head of state & government" : "Head of government",
      "pm",
      true,
    );
    if (same) headOfState = null;
  }

  return { headOfState, headOfGovernment };
}

async function fetchLiveGovernment(
  iso2: string,
  countryName: string,
): Promise<CountryGovernment> {
  const leaders = await fetchLeadersOnly(iso2, countryName);

  const sparqlRows = await sparqlCabinet(iso2);
  const leaderNames = new Set(
    [leaders.headOfState?.name, leaders.headOfGovernment?.name]
      .filter(Boolean)
      .map((n) => n!.toLowerCase()),
  );

  let ministers: GovMember[] = [];

  if (sparqlRows.length >= 3) {
    const candidates = sparqlRows
      .filter((r) => !leaderNames.has(r.name.toLowerCase()))
      .slice(0, 24);

    const enrichIds = candidates.slice(0, 8).map((c) => c.qid);
    const entities = await wdGetEntities(enrichIds);

    for (let i = 0; i < candidates.length; i++) {
      const row = candidates[i]!;
      const ent = entities[row.qid];
      if (ent && i < 8) {
        const member = await personToMember(ent, row.role, "minister", true);
        if (member) {
          member.role = row.role;
          if (!member.photo && row.image) member.photo = commonsThumb(row.image);
          ministers.push(member);
          continue;
        }
      }
      ministers.push({
        name: row.name,
        role: row.role,
        party: "",
        bio: clipBio(row.desc || `${row.name} — ${row.role}.`),
        tier: "minister",
        photo: row.image ? commonsThumb(row.image) : undefined,
        source: "wikidata",
      });
    }
  } else {
    // Wikipedia cabinet tables — works when WDQS is down or sparse (e.g. US)
    const wikiMinisters = await fetchWikipediaCabinet(
      countryName,
      leaders.headOfGovernment?.name ?? leaders.headOfState?.name,
    );
    ministers = wikiMinisters.filter(
      (m) => !leaderNames.has(m.name.toLowerCase()),
    );
  }

  return {
    asOf: new Date().toISOString().slice(0, 10),
    headOfState: leaders.headOfState,
    headOfGovernment: leaders.headOfGovernment,
    ministers,
    sourceNote:
      "Leadership from Wikidata; cabinet from Wikidata SPARQL when available, otherwise Wikipedia cabinet tables. Portraits and bios via Wikipedia / Wikimedia Commons. Living snapshot — not an official gazette.",
  };
}
