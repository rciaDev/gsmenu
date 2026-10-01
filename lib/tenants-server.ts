import "server-only";

import { mesaExisteNoGsMarket } from "./gsmarket/mesas";
import { getTenantConfig } from "./painel/store";
import {
  DEFAULT_TENANT_SLUG,
  TENANTS,
  type TenantRecord,
} from "./tenants";

/**
 * Tenant com merge do store do painel (logo, mesas, CNPJ, etc.).
 * Só use em Route Handlers / Server Components — nunca no client.
 */
export function getTenantBySlug(
  slug: string | null | undefined,
): TenantRecord | null {
  if (!slug) return null;
  const key = slug.toLowerCase().trim();
  const base = TENANTS[key];
  const stored = getTenantConfig(key);

  if (!base && !stored) return null;

  const envKey =
    process.env[`GSMARKET_CHAVE_${key.toUpperCase()}`] ??
    process.env.GSMARKET_CHAVE ??
    null;
  const envCnpj = process.env[`GSMARKET_CNPJ_${key.toUpperCase()}`];
  const empresaRaw = process.env[`GSMARKET_EMPRESA_${key.toUpperCase()}`];

  const nome = stored?.nome ?? base?.nome ?? key;
  const cnpj = envCnpj ?? stored?.cnpj ?? base?.cnpj ?? "";
  const empresa = empresaRaw
    ? Number(empresaRaw)
    : (stored?.empresa ?? base?.empresa ?? 1);

  return {
    slug: key,
    nome,
    cnpj,
    empresa: Number.isFinite(empresa) ? empresa : 1,
    logoUrl: stored?.logoUrl ?? base?.logoUrl ?? null,
    heroUrl: stored?.heroUrl ?? base?.heroUrl ?? null,
    cor: stored?.cor ?? base?.cor ?? "#C45C26",
    cidade: stored?.cidade ?? base?.cidade ?? "",
    qtdMesas: stored?.mesas?.length
      ? stored.mesas.length
      : (base?.qtdMesas ?? 20),
    chave: envKey ?? stored?.chave ?? base?.chave ?? null,
  };
}

export function getDefaultTenant(): TenantRecord {
  return getTenantBySlug(DEFAULT_TENANT_SLUG) ?? TENANTS[DEFAULT_TENANT_SLUG];
}

/** Valida se a mesa existe no GSMarket (ou mock 1..qtdMesas). */
export async function mesaPermitidaNoTenant(
  tenant: TenantRecord,
  mesa: number,
): Promise<boolean> {
  return mesaExisteNoGsMarket(tenant, mesa);
}
