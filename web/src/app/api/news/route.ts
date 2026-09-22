import { NextResponse } from "next/server";
import { fetchNepalNews } from "@/lib/connectors/news";

export const dynamic = "force-dynamic";

export async function GET() {
  const news = await fetchNepalNews();
  return NextResponse.json({ items: news, generatedAt: new Date().toISOString() });
}
