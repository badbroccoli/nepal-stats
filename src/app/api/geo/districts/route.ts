import { readFile } from "fs/promises";
import path from "path";
import { CACHE_STATIC } from "@/lib/http";

export async function GET() {
  try {
    const file = path.join(process.cwd(), "src/data/nepal-districts.geojson");
    const raw = await readFile(file, "utf8");
    return new Response(raw, {
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
