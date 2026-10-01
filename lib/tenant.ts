import { headers } from "next/headers";
import {
  DEFAULT_TENANT_SLUG,
  TENANT_HEADER,
  slugFromHost,
} from "./tenants";
import { getDefaultTenant, getTenantBySlug } from "./tenants-server";
import type { TenantRecord } from "./tenants";

export { TENANT_HEADER };

export async function resolveTenantSlug(): Promise<string> {
  const h = await headers();
  const fromHeader = h.get(TENANT_HEADER);
  if (fromHeader) {
    const tenant = getTenantBySlug(fromHeader);
    if (tenant) return tenant.slug;
    // slug cadastrado só no store / host — aceita o header do proxy
    if (/^[a-z0-9-]+$/.test(fromHeader)) return fromHeader.toLowerCase();
  }

  const host = h.get("x-forwarded-host") ?? h.get("host");
  const fromHost = slugFromHost(host);
  if (fromHost) {
    if (getTenantBySlug(fromHost) || /^[a-z0-9-]+$/.test(fromHost)) {
      return fromHost;
    }
  }

  return DEFAULT_TENANT_SLUG;
}

export async function resolveTenant(): Promise<TenantRecord> {
  const slug = await resolveTenantSlug();
  return getTenantBySlug(slug) ?? getDefaultTenant();
}

export function resolveTenantSlugFromRequest(request: Request): string {
  const headerSlug = request.headers.get(TENANT_HEADER);
  if (headerSlug) {
    if (getTenantBySlug(headerSlug)) return headerSlug.toLowerCase();
    if (/^[a-z0-9-]+$/.test(headerSlug)) return headerSlug.toLowerCase();
  }

  const url = new URL(request.url);
  const querySlug = url.searchParams.get("tenant");
  if (querySlug) {
    if (getTenantBySlug(querySlug)) return querySlug.toLowerCase();
    if (/^[a-z0-9-]+$/.test(querySlug)) return querySlug.toLowerCase();
  }

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const fromHost = slugFromHost(host);
  if (fromHost) {
    if (getTenantBySlug(fromHost) || /^[a-z0-9-]+$/.test(fromHost)) {
      return fromHost;
    }
  }

  return DEFAULT_TENANT_SLUG;
}
