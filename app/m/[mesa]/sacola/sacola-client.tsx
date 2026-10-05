"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition, type CSSProperties } from "react";
import { formatBRL } from "@/lib/format";
import {
  clearCart,
  readCart,
  setCartLineQty,
  // setCartObsGeral, // Observação geral — UI ocultada
  type CartLine,
} from "@/lib/cart-storage";

type Props = {
  mesa: number;
  tenantSlug: string;
  cor: string;
  nomeEstabelecimento: string;
};

export function SacolaClient({
  mesa,
  tenantSlug,
  cor,
  nomeEstabelecimento,
}: Props) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [obsGeral, setObsGeral] = useState("");
  const [ready, setReady] = useState(false);
  const [enviando, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);

  const sync = useCallback(() => {
    const state = readCart(tenantSlug, mesa);
    setLines(state.lines);
    setObsGeral(state.obsGeral);
  }, [tenantSlug, mesa]);

  useEffect(() => {
    sync();
    setReady(true);
    function onCart(e: Event) {
      const detail = (e as CustomEvent).detail as
        | { tenantSlug?: string; mesa?: number }
        | undefined;
      if (
        detail &&
        detail.tenantSlug === tenantSlug &&
        detail.mesa === mesa
      ) {
        sync();
      } else if (!detail) {
        sync();
      }
    }
    window.addEventListener("gsmenu:cart", onCart);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("gsmenu:cart", onCart);
      window.removeEventListener("storage", sync);
    };
  }, [sync, tenantSlug, mesa]);

  const totalItens = lines.reduce((acc, l) => acc + l.qtd, 0);
  const totalValor = lines.reduce(
    (acc, l) => acc + l.produto.preco * l.qtd,
    0,
  );

  function changeQtd(key: string, qtd: number) {
    setCartLineQty(tenantSlug, mesa, key, qtd);
    sync();
  }

  // Observação geral — UI ocultada por enquanto
  // function changeObs(value: string) {
  //   setObsGeral(value);
  //   setCartObsGeral(tenantSlug, mesa, value);
  // }

  function enviarPedido() {
    setErro(null);
    setResultado(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/pedidos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant: tenantSlug,
            mesa,
            observacaoGeral: obsGeral || undefined,
            itens: lines.map((l) => ({
              produto: l.produto.produto,
              barra: l.produto.barra,
              descricao: l.produto.nome,
              qtd: l.qtd,
              preco: l.produto.preco,
              obs: l.obs || undefined,
            })),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErro(data.error ?? "Falha ao enviar pedido");
          return;
        }
        clearCart(tenantSlug, mesa);
        setLines([]);
        setObsGeral("");
        setResultado(
          `Pedido enviado para a mesa ${data.mesa} · ${formatBRL(data.total)}`,
        );
      } catch {
        setErro("Não foi possível enviar. Tente de novo.");
      }
    });
  }

  return (
    <div
      className="menu-shell flex min-h-full flex-col"
      style={
        {
          "--accent": cor,
          "--accent-soft": `${cor}22`,
        } as CSSProperties
      }
    >
      <header className="sticky top-0 z-20 border-b border-black/5 bg-[var(--surface)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href={`/m/${mesa}`}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5"
            aria-label="Voltar ao cardápio"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-lg font-semibold text-[var(--ink)]">
              Sacola · Mesa {mesa}
            </h1>
            <p className="truncate text-xs text-[var(--muted)]">
              {nomeEstabelecimento}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6">
        {!ready ? (
          <p className="py-16 text-center text-sm text-[var(--muted)]">
            Carregando sacola…
          </p>
        ) : resultado ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {resultado}
            </p>
            <Link
              href={`/m/${mesa}`}
              className="mt-6 inline-flex rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
            >
              Voltar ao cardápio
            </Link>
          </div>
        ) : lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
            <p className="text-[var(--muted)]">Sua sacola está vazia.</p>
            <Link
              href={`/m/${mesa}`}
              className="mt-6 inline-flex rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
            >
              Ver cardápio
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {lines.map((line) => (
                <li
                  key={line.key}
                  className="flex items-start justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/[0.04]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--ink)]">
                      {line.produto.nome}
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {formatBRL(line.produto.preco)}
                    </p>
                    {line.obs ? (
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Obs: {line.obs}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="h-8 w-8 rounded-full bg-black/5 text-lg"
                      onClick={() => changeQtd(line.key, line.qtd - 1)}
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm font-semibold">
                      {line.qtd}
                    </span>
                    <button
                      type="button"
                      className="h-8 w-8 rounded-full bg-black/5 text-lg"
                      onClick={() => changeQtd(line.key, line.qtd + 1)}
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Observação geral — oculto por enquanto
            <label className="mt-6 block">
              <span className="mb-1 block text-sm text-[var(--muted)]">
                Observação geral
              </span>
              <textarea
                value={obsGeral}
                onChange={(e) => changeObs(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-black/8 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="Ex.: entregar tudo junto…"
              />
            </label>
            */}

            {erro && <p className="mt-3 text-sm text-red-700">{erro}</p>}

            <div className="mt-auto border-t border-black/5 pt-6">
              <div className="flex items-center justify-between text-base font-semibold">
                <span>
                  Total · {totalItens} {totalItens === 1 ? "item" : "itens"}
                </span>
                <span>{formatBRL(totalValor)}</span>
              </div>
              <button
                type="button"
                disabled={enviando || lines.length === 0}
                onClick={enviarPedido}
                className="mt-4 w-full rounded-2xl bg-[var(--accent)] py-3.5 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {enviando ? "Enviando…" : "Fazer pedido"}
              </button>
              <p className="mt-2 text-center text-xs text-[var(--muted)]">
                O pedido será enviado para a mesa {mesa}
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
