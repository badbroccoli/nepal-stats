import { NewsRail } from "@/components/NewsRail";
import { SectionHeader, SourceStamp } from "@/components/SectionHeader";
import { fetchNepalNews } from "@/lib/connectors/news";
import { CALENDAR_EVENTS } from "@/lib/seed/metrics";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const news = await fetchNepalNews();

  return (
    <div>
      <SectionHeader
        title="News & Calendar"
        titleNp="समाचार"
        blurb="Aggregated headlines from a wide set of Nepali and Nepal-focused outlets (titles + links only), plus an economic/holiday calendar."
      />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <NewsRail items={news} />
        <div className="panel rounded-sm p-4">
          <h2 className="mb-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Release & holiday calendar
          </h2>
          <ul className="space-y-3">
            {CALENDAR_EVENTS.map((e) => (
              <li
                key={e.date + e.title}
                className="border-b border-[var(--border)] pb-3"
              >
                <div className="mono text-xs text-[var(--accent)]">{e.date}</div>
                <div className="mt-1 text-sm">{e.title}</div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  {e.type}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <SourceStamp />
    </div>
  );
}
