import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DEFAULT_TENANT_SLUG,
  TENANT_HEADER,
  slugFromHost,
} from "@/lib/tenants";

function normalizeSlug(value: string | null): string | null {
  if (!value) return null;
  const s = value.toLowerCase().trim();
  if (!/^[a-z0-9-]+$/.test(s)) return null;
  return s;
}

export function proxy(request: NextRequest) {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const fromHost = slugFromHost(host);
  const fromQuery = normalizeSlug(request.nextUrl.searchParams.get("tenant"));

  let slug = DEFAULT_TENANT_SLUG;
  if (fromQuery) {
    slug = fromQuery;
  } else if (fromHost) {
    slug = fromHost;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(TENANT_HEADER, slug);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
