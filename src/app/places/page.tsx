import { SectionHeader, SourceStamp } from "@/components/SectionHeader";
import { NepalMap } from "@/components/NepalMap";
import { fetchNepalEarthquakes } from "@/lib/connectors/usgs";
import { PROVINCE_NAMES } from "@/lib/domains";

export const dynamic = "force-dynamic";

export default async function PlacesPage() {
  const quakes = await fetchNepalEarthquakes();

  return (
    <div>
      <SectionHeader
        title="Places"
        titleNp="स्थानहरू"
        blurb="OpenFreeMap basemap with district choropleth, headquarters, placenames, and earthquake markers. Hover or click districts and quake dots for population, density, felt reports, depth, and USGS details."
      />
      <NepalMap quakes={quakes} height="640px" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(PROVINCE_NAMES).map(([id, names]) => (
          <div key={id} className="panel rounded-sm p-4">
            <div className="text-xs text-[var(--muted)]">Province {id}</div>
            <div className="display mt-1 text-xl">{names.en}</div>
            <div className="text-sm text-[var(--muted)]">{names.np}</div>
          </div>
        ))}
      </div>
      <SourceStamp />
    </div>
  );
}
