import { readFile } from "fs/promises";
import path from "path";
import { CACHE_STATIC } from "@/lib/http";

export async function GET() {
  try {
    const candidates = [
      path.join(process.cwd(), "public/geo/nepal-districts.geojson"),
      path.join(process.cwd(), "src/data/nepal-districts.geojson"),
    ];
    let raw: string | null = null;
    for (const file of candidates) {
      try {
        raw = await readFile(file, "utf8");
        break;
      } catch {
        // try next
      }
    }
    if (!raw) {
      return Response.json(
        { error: "District geometry file not found" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }
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
