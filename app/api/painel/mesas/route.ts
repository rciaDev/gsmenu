import { fetchMesasFromGsMarket } from "@/lib/gsmarket/mesas";
import { resolveTenantSlugFromRequest } from "@/lib/tenant";
import { getTenantBySlug } from "@/lib/tenants-server";

export async function GET(request: Request) {
  const slug = resolveTenantSlugFromRequest(request);
  const tenant = getTenantBySlug(slug);
  if (!tenant) {
    return Response.json({ error: "Tenant inválido" }, { status: 404 });
  }

  try {
    const mesas = await fetchMesasFromGsMarket(tenant);
    return Response.json({
      mesas,
      qtdMesas: mesas.length,
      baseUrl: `https://${tenant.slug}.gsmarket.com.br/m`,
    });
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Falha ao listar mesas do GSMarket",
      },
      { status: 502 },
    );
  }
}
