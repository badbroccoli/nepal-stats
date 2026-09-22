import { NextResponse } from "next/server";
import { getNews } from "@/lib/sources/news";

export const dynamic = "force-dynamic";

export async function GET() {
  const { items, stale } = await getNews();
  return NextResponse.json(
    { count: items.length, stale, items },
    { headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
