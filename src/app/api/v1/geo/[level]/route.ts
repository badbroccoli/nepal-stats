import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

const FILES: Record<string, string> = {
  districts: "nepal-districts.geojson",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ level: string }> },
) {
  const { level } = await params;
  const file = FILES[level];
  if (!file) {
    return NextResponse.json(
      { error: `Unknown geo level '${level}'. Available: ${Object.keys(FILES).join(", ")}` },
      { status: 404 },
    );
  }

  const filePath = path.join(process.cwd(), "src", "data", file);
  const geojson = await readFile(filePath, "utf8");

  return new NextResponse(geojson, {
    headers: {
      "content-type": "application/geo+json",
      "cache-control": "public, max-age=86400, immutable",
    },
  });
}
