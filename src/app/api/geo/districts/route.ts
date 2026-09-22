import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  const file = path.join(process.cwd(), "src/data/nepal-districts.geojson");
  const raw = await readFile(file, "utf8");
  return new NextResponse(raw, {
    headers: {
      "Content-Type": "application/geo+json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
