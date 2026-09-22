import { CACHE_STATIC } from "@/lib/http";
import districts from "@/data/nepal-districts.json";

export async function GET() {
  try {
    return new Response(JSON.stringify(districts), {
      headers: {
        "Content-Type": "application/geo+json",
        "Cache-Control": CACHE_STATIC,
      },
    });
  } catch (err) {
    console.error("[geo/districts]", err);
    return Response.json(
      { error: "Failed to load district geometry" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
