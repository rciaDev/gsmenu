import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolveTenant } from "@/lib/tenant";
import { mesaPermitidaNoTenant } from "@/lib/tenants-server";
import { SacolaClient } from "./sacola-client";

type PageProps = {
  params: Promise<{ mesa: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { mesa } = await params;
  const tenant = await resolveTenant();
  return {
    title: `Sacola · Mesa ${mesa} · ${tenant.nome}`,
    description: `Sacola do pedido — mesa ${mesa}`,
  };
}

export default async function SacolaPage({ params }: PageProps) {
  const { mesa: mesaParam } = await params;
  const mesa = Number(mesaParam);

  if (!Number.isInteger(mesa) || mesa < 1) {
    notFound();
  }

  const tenant = await resolveTenant();
  if (!(await mesaPermitidaNoTenant(tenant, mesa))) {
    notFound();
  }

  return (
    <SacolaClient
      mesa={mesa}
      tenantSlug={tenant.slug}
      cor={tenant.cor}
      nomeEstabelecimento={tenant.nome}
    />
  );
}
