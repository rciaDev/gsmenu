"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader, PanelCard } from "@/app/painel/_components/ui";

const ATALHOS = [
  {
    href: "/painel/gestao",
    title: "Gestão",
    desc: "Logo, cores e dados do estabelecimento.",
  },
  {
    href: "/painel/cardapio",
    title: "Cardápio",
    desc: "Produtos nas categorias fixas do cardápio digital.",
  },
  {
    href: "/painel/qrcodes",
    title: "QR Codes",
    desc: "Gerar e baixar QR das mesas do GSMarket.",
  },
  {
    href: "/painel/pedidos",
    title: "Pedidos",
    desc: "Pedidos enviados pelo cardápio para as mesas.",
  },
];

export default function PainelHomePage() {
  const [mesas, setMesas] = useState<number | null>(null);
  const [pedidosHoje, setPedidosHoje] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/painel/mesas")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setMesas(data.qtdMesas ?? data.mesas?.length ?? 0);
      });
    fetch("/api/painel/pedidos")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.pedidos) return;
        const today = new Date().toDateString();
        const n = data.pedidos.filter(
          (p: { quando: string }) =>
            new Date(p.quando).toDateString() === today,
        ).length;
        setPedidosHoje(n);
      });
  }, []);

  return (
    <div>
      <PageHeader
        title="Olá, bem-vindo"
        description="Painel do GSMenu: estabelecimento, cardápio, QR Codes das mesas e pedidos."
        actions={
          <>
            <Link
              href="/m/1"
              target="_blank"
              className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition hover:bg-black/[0.03]"
            >
              Ver cardápio
            </Link>
            <Link
              href="/painel/qrcodes"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              QR Codes
            </Link>
          </>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Mesas", value: mesas == null ? "…" : String(mesas) },
          {
            label: "Pedidos hoje",
            value: pedidosHoje == null ? "…" : String(pedidosHoje),
          },
          { label: "Status", value: "Online" },
        ].map((stat) => (
          <PanelCard key={stat.label}>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
              {stat.label}
            </p>
            <p className="font-display mt-2 text-3xl font-semibold">
              {stat.value}
            </p>
          </PanelCard>
        ))}
      </div>

      <h2 className="font-display mb-3 text-lg font-semibold">Atalhos</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {ATALHOS.map((a) => (
          <Link key={a.href} href={a.href} className="block">
            <PanelCard className="h-full transition hover:border-[var(--accent)]/30 hover:shadow-md">
              <p className="font-semibold text-[var(--ink)]">{a.title}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{a.desc}</p>
            </PanelCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
