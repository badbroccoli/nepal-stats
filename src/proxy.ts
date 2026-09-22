import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isCountryCode } from "@/lib/countries";

/** Per-isolate sliding window: light abuse protection for public API routes. */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 90;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const LEGACY_ROOTS = new Set([
  "people",
  "economy",
  "government",
  "health",
  "education",
  "energy",
  "environment",
  "disasters",
  "tourism",
  "digital",
  "transport",
  "agriculture",
  "migration",
  "places",
  "news",
]);

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function pruneStale(now: number) {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function rateLimitApi(request: NextRequest): NextResponse | null {
  const now = Date.now();
  const key = clientKey(request);
  pruneStale(now);

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  if (bucket.count > MAX_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(MAX_REQUESTS));
  response.headers.set(
    "X-RateLimit-Remaining",
    String(Math.max(0, MAX_REQUESTS - bucket.count)),
  );
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return rateLimitApi(request) ?? NextResponse.next();
  }

  const first = pathname.split("/").filter(Boolean)[0];

  // Old Nepal deep links → /np/...
  if (first && LEGACY_ROOTS.has(first)) {
    const url = request.nextUrl.clone();
    url.pathname = `/np${pathname}`;
    return NextResponse.redirect(url);
  }

  // Soft guard for unknown two-letter codes (page layout still 404s).
  if (first && first.length === 2 && !isCountryCode(first)) {
    // fall through
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|icon.png|geo|vendor|cabinet).*)",
  ],
};
