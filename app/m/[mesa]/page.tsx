import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCardapioMock } from "@/lib/cardapio-mock";
import { fetchCardapioFromGsMarket } from "@/lib/gsmarket/cardapio";
import { useGsMarketMock } from "@/lib/gsmarket/config";
import { resolveTenant } from "@/lib/tenant";
import { mesaPermitidaNoTenant } from "@/lib/tenants-server";
import { MenuClient } from "./menu-client";

type PageProps = {
  params: Promise<{ mesa: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { mesa } = await params;
  const tenant = await resolveTenant();
  return {
    title: `${tenant.nome} · Mesa ${mesa}`,
    description: `Cardápio digital — mesa ${mesa}`,
  };
}

export default async function MesaPage({ params }: PageProps) {
  const { mesa: mesaParam } = await params;
  const mesa = Number(mesaParam);

  if (!Number.isInteger(mesa) || mesa < 1) {
    notFound();
  }

  const tenant = await resolveTenant();
  if (!(await mesaPermitidaNoTenant(tenant, mesa))) {
    notFound();
  }

  if (useGsMarketMock()) {
    const cardapio = getCardapioMock(tenant.slug);
    if (!cardapio) notFound();
    return (
      <MenuClient mesa={mesa} tenantSlug={tenant.slug} cardapio={cardapio} />
    );
  }

  try {
    const cardapio = await fetchCardapioFromGsMarket(tenant);
    return (
      <MenuClient mesa={mesa} tenantSlug={tenant.slug} cardapio={cardapio} />
    );
  } catch (err) {
    console.error("[GSMenu cardápio]", err);
    const msg =
      err instanceof Error ? err.message : "Não foi possível carregar o cardápio.";
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-[var(--ink)]">
          Cardápio indisponível
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{msg}</p>
        <p className="mt-4 text-xs text-[var(--muted)]">Mesa {mesa}</p>
      </main>
    );
  }
}
