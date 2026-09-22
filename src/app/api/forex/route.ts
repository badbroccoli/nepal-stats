import { NextResponse } from "next/server";
import { fetchNrbForex } from "@/lib/connectors/nrb";

export const dynamic = "force-dynamic";

export async function GET() {
  const rates = await fetchNrbForex();
  return NextResponse.json({ rates, generatedAt: new Date().toISOString() });
}
