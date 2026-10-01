import type { TenantConfig } from "./types";

/**
 * Tenants GSMenu (slug → CNPJ + EMPRESA).
 * CHAVE (PARAMETROS.CHAVE) vem de env / painel — nunca expor ao browser.
 * Seguro para proxy/edge e client (sem fs).
 */
export type TenantRecord = TenantConfig & {
  /** Sobrescrito por GSMARKET_CHAVE_{SLUG} ou GSMARKET_CHAVE */
  chave?: string | null;
};

export const TENANTS: Record<string, TenantRecord> = {
  senzala: {
    slug: "senzala",
    nome: "Senzala Burger",
    cnpj: "12345678000199",
    empresa: 1,
    logoUrl: null,
    heroUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=80",
    cor: "#C45C26",
    cidade: "Mogi das Cruzes - SP",
    qtdMesas: 20,
  },
  demo: {
    slug: "demo",
    nome: "Hamburgueria Artesanal",
    cnpj: "98765432000111",
    empresa: 1,
    logoUrl: null,
    heroUrl:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&q=80",
    cor: "#B45309",
    cidade: "São Paulo - SP",
    qtdMesas: 12,
  },
};

export const DEFAULT_TENANT_SLUG = "senzala";

/** Header interno setado pelo proxy — slug do tenant da request */
export const TENANT_HEADER = "x-tenant-slug";

/** Resolução estática + env (sem store). Preferir getTenantBySlug de tenants-server no Node. */
export function getStaticTenantBySlug(
  slug: string | null | undefined,
): TenantRecord | null {
  if (!slug) return null;
  const key = slug.toLowerCase().trim();
  const base = TENANTS[key];
  if (!base) return null;

  const envKey =
    process.env[`GSMARKET_CHAVE_${key.toUpperCase()}`] ??
    process.env.GSMARKET_CHAVE ??
    null;
  const envCnpj = process.env[`GSMARKET_CNPJ_${key.toUpperCase()}`];
  const empresaRaw = process.env[`GSMARKET_EMPRESA_${key.toUpperCase()}`];
  const empresa = empresaRaw ? Number(empresaRaw) : base.empresa;

  return {
    ...base,
    cnpj: envCnpj ?? base.cnpj,
    empresa: Number.isFinite(empresa) ? empresa : base.empresa,
    chave: envKey ?? base.chave ?? null,
  };
}

/** Alias estático — proxy/edge. Em APIs use `@/lib/tenants-server`. */
export const getTenantBySlug = getStaticTenantBySlug;

/**
 * Extrai o slug do host: senzala.gsmarket.com.br → senzala
 */
export function slugFromHost(host: string | null): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0].toLowerCase();

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".vercel.app")
  ) {
    return null;
  }

  const match = hostname.match(/^([a-z0-9-]+)\.gsmarket\.com\.br$/i);
  if (match && match[1] !== "www" && match[1] !== "menu") {
    return match[1];
  }

  const parts = hostname.split(".");
  if (parts.length >= 3) {
    const sub = parts[0];
    if (sub !== "www" && sub !== "app") return sub;
  }

  return null;
}

