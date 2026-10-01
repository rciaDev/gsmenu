"use client";

import { useEffect, useState } from "react";
import { formatBRL } from "@/lib/format";
import { PageHeader, PanelCard } from "@/app/painel/_components/ui";

type PedidoRow = {
  id: string;
  mesa: number;
  total: number;
  itens: number;
  status: string;
  quando: string;
};

function formatQuando(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/painel/pedidos")
      .then(async (res) => {
        if (!res.ok) return { pedidos: [] };
        return res.json();
      })
      .then((data) => setPedidos(data.pedidos ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Pedidos"
        description="Pedidos feitos pelo cardápio digital nas mesas do estabelecimento."
      />

      <PanelCard className="!p-0 overflow-hidden">
        <div className="hidden grid-cols-[80px_1fr_100px_120px_140px] gap-3 border-b border-black/6 px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--muted)] sm:grid">
          <span>Mesa</span>
          <span>Status</span>
          <span>Itens</span>
          <span>Total</span>
          <span>Quando</span>
        </div>
        {loading ? (
          <p className="px-5 py-10 text-sm text-[var(--muted)]">Carregando…</p>
        ) : pedidos.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[var(--muted)]">
            Nenhum pedido enviado pelo cardápio ainda.
          </p>
        ) : (
          <ul className="divide-y divide-black/5">
            {pedidos.map((p) => (
              <li
                key={p.id}
                className="grid gap-1 px-5 py-4 sm:grid-cols-[80px_1fr_100px_120px_140px] sm:items-center sm:gap-3"
              >
                <span className="font-semibold">#{p.mesa}</span>
                <span className="text-sm text-[var(--muted)]">{p.status}</span>
                <span className="text-sm">{p.itens}</span>
                <span className="text-sm font-medium">{formatBRL(p.total)}</span>
                <span className="text-sm text-[var(--muted)]">
                  {formatQuando(p.quando)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
    </div>
  );
}

