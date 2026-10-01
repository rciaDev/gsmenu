import {
  GsMarketApiError,
  GsMarketOfflineError,
} from "@/lib/gsmarket/central";
import { useGsMarketMock } from "@/lib/gsmarket/config";
import { enviarPedidoGsMarket } from "@/lib/gsmarket/pedidos";
import { appendPedidoLog } from "@/lib/painel/store";
import { resolveTenantSlugFromRequest } from "@/lib/tenant";
import {
  getTenantBySlug,
  mesaPermitidaNoTenant,
} from "@/lib/tenants-server";
import type { PedidoInput, PedidoResponse } from "@/lib/types";
import { Sirivennela } from "next/font/google";

export async function POST(request: Request) {
  let body: PedidoInput;
  try {
    body = (await request.json()) as PedidoInput;
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const slug = body.tenant || resolveTenantSlugFromRequest(request);
  const tenant = getTenantBySlug(slug);
  if (!tenant) {
    return Response.json({ error: "Tenant inválido" }, { status: 404 });
  }

  const mesa = Number(body.mesa);
  if (!(await mesaPermitidaNoTenant(tenant, mesa))) {
    return Response.json(
      { error: "Mesa inválida ou não cadastrada no GSMarket." },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.itens) || body.itens.length === 0) {
    return Response.json({ error: "Informe ao menos um item" }, { status: 400 });
  }

  for (const item of body.itens) {
    if (!item.produto || !item.qtd || item.qtd <= 0 || item.preco == null) {
      return Response.json(
        { error: "Item inválido: produto, qtd e preco são obrigatórios" },
        { status: 400 },
      );
    }
  }

  function logPedido(total: number, mock: boolean) {
    try {
      appendPedidoLog({
        slug,
        mesa,
        total: Math.round(total * 100) / 100,
        itens: body.itens.length,
        status: "Enviado",
        mock,
        observacaoGeral: body.observacaoGeral,
      });
    } catch (err) {
      console.warn("[GSMenu] falha ao gravar log de pedido", err);
    }
  }

  if (useGsMarketMock()) {
    const total = body.itens.reduce(
      (acc, item) => acc + item.preco * item.qtd,
      0,
    );
    logPedido(total, true);
    const response: PedidoResponse = {
      ok: true,
      mesa,
      itensInseridos: body.itens.length,
      total: Math.round(total * 100) / 100,
      mock: true,
    };
    return Response.json(response);
  }

  try {
    const result = await enviarPedidoGsMarket(
      tenant,
      mesa,
      body.itens,
      body.observacaoGeral,
    );
    logPedido(result.total, false);
    const response: PedidoResponse = {
      ok: true,
      mesa: result.mesa,
      itensInseridos: result.itensInseridos,
      total: result.total,
      mock: false,
    };
    return Response.json(response);
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
      return Response.json({ error: err.message }, { status: err.status });
    }
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Falha ao enviar pedido!",
      },
      { status: 502 },
    );
  }
}
