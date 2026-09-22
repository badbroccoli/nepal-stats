import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isCountryCode } from "@/lib/countries";
import { isDomainId } from "@/lib/domains";

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/").filter(Boolean)[0];

  // Old Nepal deep links → /np/...
  if (first && LEGACY_ROOTS.has(first)) {
    const url = request.nextUrl.clone();
    url.pathname = `/np${pathname}`;
    return NextResponse.redirect(url);
  }

  // Invalid country codes under /xx should 404 via layout; skip api etc.
  if (first && first.length === 2 && !isCountryCode(first)) {
    // Let Next render not-found when layout checks; no special handling.
  }

  // Guard: /np/foo where foo is not a domain → notFound in page
  if (first && isCountryCode(first)) {
    const second = pathname.split("/").filter(Boolean)[1];
    if (second && !isDomainId(second)) {
      // fall through; [domain] page will notFound
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.png|geo|vendor|cabinet).*)",
  ],
};
