import { getCardapioMock } from "@/lib/cardapio-mock";
import { fetchCardapioFromGsMarket } from "@/lib/gsmarket/cardapio";
import {
  GsMarketApiError,
  GsMarketOfflineError,
} from "@/lib/gsmarket/central";
import { useGsMarketMock } from "@/lib/gsmarket/config";
import { resolveTenantSlugFromRequest } from "@/lib/tenant";
import { getTenantBySlug } from "@/lib/tenants-server";

//ainda como mock, pois o cardapio é gerado pelo painel de controle

export async function GET(request: Request) {
  const slug = resolveTenantSlugFromRequest(request);
  const tenant = getTenantBySlug(slug);

  if (!tenant) {
    return Response.json(
      { error: "Tenant não encontrado", slug },
      { status: 404 },
    );
  }

  if (useGsMarketMock()) {
    const cardapio = getCardapioMock(slug);
    if (!cardapio) {
      return Response.json(
        { error: "Cardápio mock não encontrado", slug },
        { status: 404 },
      );
    }
    return Response.json({ ...cardapio, source: "mock" });
  }

  try {
    const cardapio = await fetchCardapioFromGsMarket(tenant);
    return Response.json({ ...cardapio, source: "gsmarket" });
  } catch (err) {
    if (err instanceof GsMarketOfflineError) {
      return Response.json(
        {
          error: "Loja offline. Tente de novo em instantes.",
          detail: err.message,
          cnpj: tenant.cnpj,
        },
        { status: 503 },
      );
    }
    if (err instanceof GsMarketApiError) {
      return Response.json(
        { error: err.message },
        { status: err.status },
      );
    }
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Falha ao ler cardápio",
      },
      { status: 502 },
    );
  }
}


