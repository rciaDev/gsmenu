import {
  getTenantConfig,
  publicTenantView,
  upsertTenantConfig,
} from "@/lib/painel/store";
import { resolveTenantSlugFromRequest } from "@/lib/tenant";
import { getTenantBySlug } from "@/lib/tenants-server";

function tenantViewForSlug(slug: string) {
  const stored = getTenantConfig(slug);
  if (stored) return publicTenantView(stored);
  const tenant = getTenantBySlug(slug);
  if (!tenant) return null;
  return {
    slug: tenant.slug,
    nome: tenant.nome,
    cidade: tenant.cidade,
    cor: tenant.cor,
    logoUrl: tenant.logoUrl,
    heroUrl: tenant.heroUrl,
    cnpj: tenant.cnpj,
    empresa: tenant.empresa,
    qtdMesas: tenant.qtdMesas,
    mesas: [] as number[],
    updatedAt: null as string | null,
  };
}

export async function GET(request: Request) {
  const slug = resolveTenantSlugFromRequest(request);
  const view = tenantViewForSlug(slug);
  if (!view) {
    return Response.json({ error: "Tenant inválido" }, { status: 404 });
  }
  return Response.json(view);
}

export async function PUT(request: Request) {
  const slug = resolveTenantSlugFromRequest(request);
  const current = getTenantBySlug(slug);
  if (!current) {
    return Response.json({ error: "Tenant inválido" }, { status: 404 });
  }

  let body: {
    nome?: string;
    cidade?: string;
    cor?: string;
    heroUrl?: string | null;
    cnpj?: string;
    empresa?: number;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const stored = getTenantConfig(slug);
  const tenant = upsertTenantConfig(slug, {
    nome: body.nome?.trim() || stored?.nome || current.nome,
    cidade: body.cidade?.trim() ?? stored?.cidade ?? current.cidade,
    cor: body.cor?.trim() || stored?.cor || current.cor,
    heroUrl:
      body.heroUrl === undefined
        ? (stored?.heroUrl ?? current.heroUrl)
        : body.heroUrl,
    cnpj: body.cnpj?.trim() ?? stored?.cnpj ?? current.cnpj,
    empresa:
      body.empresa != null && Number.isFinite(Number(body.empresa))
        ? Number(body.empresa)
        : (stored?.empresa ?? current.empresa),
  });

  return Response.json(publicTenantView(tenant));
}
