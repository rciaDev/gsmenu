import { listPedidos } from "@/lib/painel/store";
import { resolveTenantSlugFromRequest } from "@/lib/tenant";

export async function GET(request: Request) {
  const slug = resolveTenantSlugFromRequest(request);
  const pedidos = listPedidos(slug, 50).map((p) => ({
    id: p.id,
    mesa: p.mesa,
    total: p.total,
    itens: p.itens,
    status: p.status,
    mock: p.mock,
    quando: p.createdAt,
  }));
  return Response.json({ pedidos });
}
