import type { CSSProperties } from "react";
import Link from "next/link";
import { resolveTenant } from "@/lib/tenant";

export default async function HomePage() {
  const tenant = await resolveTenant();

  return (
    <div
      className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-[var(--surface)]"
      style={
        {
          "--accent": tenant.cor,
          "--accent-soft": `${tenant.cor}22`,
        } as CSSProperties
      }
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% -10%, var(--accent-soft), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, #f59e0b22, transparent)",
        }}
      />
      <main className="relative mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          GSMenu
        </p>
        <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight text-[var(--ink)]">
          {tenant.nome}
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          Cardápio digital por mesa. Escaneie o QR Code ou abra uma mesa para
          fazer o pedido.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/m/1"
            className="inline-flex items-center justify-center rounded-2xl bg-[var(--accent)] px-5 py-3.5 text-center font-semibold text-white transition hover:brightness-110"
          >
            Abrir mesa 1
          </Link>
          <Link
            href="/painel"
            className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-5 py-3.5 text-center font-medium text-[var(--ink)] transition hover:bg-black/[0.03]"
          >
            Painel admin
          </Link>
        </div>
      </main>
    </div>
  );
}
