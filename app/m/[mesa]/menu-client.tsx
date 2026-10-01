"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import Image from "next/image";
import { formatBRL, formatTempoPreparo } from "@/lib/format";
import {
  addToCart,
  readCart,
  type CartLine,
} from "@/lib/cart-storage";
import type { CardapioResponse, Produto } from "@/lib/types";
import { ProductDetail } from "./product-detail";
import { Sirivennela } from "next/font/google";

type Props = {
  mesa: number;
  tenantSlug: string;
  cardapio: CardapioResponse;
};

export function MenuClient({ mesa, tenantSlug, cardapio }: Props) {
  const { estabelecimento, categorias } = cardapio;
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("todas");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [produtoAberto, setProdutoAberto] = useState<Produto | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);

  const syncCart = useCallback(() => {
    setCart(readCart(tenantSlug, mesa).lines);
  }, [tenantSlug, mesa]);

  useEffect(() => {
    syncCart();
    function onCart(e: Event) {
      const detail = (e as CustomEvent).detail as
        | { tenantSlug?: string; mesa?: number }
        | undefined;
      if (
        !detail ||
        (detail.tenantSlug === tenantSlug && detail.mesa === mesa)
      ) {
        syncCart();
      }
    }
    window.addEventListener("gsmenu:cart", onCart);
    return () => window.removeEventListener("gsmenu:cart", onCart);
  }, [syncCart, tenantSlug, mesa]);

  const nomesCategorias = useMemo(
    () => ["todas", ...categorias.map((c) => c.nome.toLocaleLowerCase("pt-BR"))],
    [categorias],
  );

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return categorias
      .filter(
        (c) =>
          categoriaAtiva === "todas" ||
          c.nome.toLocaleLowerCase("pt-BR") === categoriaAtiva,
      )
      .map((c) => ({
        ...c,
        produtos: c.produtos.filter((p) => {
          if (!q) return true;
          return (
            p.nome.toLowerCase().includes(q) ||
            (p.ingredientes?.toLowerCase().includes(q) ?? false)
          );
        }),
      }))
      .filter((c) => c.produtos.length > 0);
  }, [categorias, categoriaAtiva, busca]);

  const totalItens = cart.reduce((acc, line) => acc + line.qtd, 0);
  const totalValor = cart.reduce(
    (acc, line) => acc + line.produto.preco * line.qtd,
    0,
  );

  function addFromDetail(produto: Produto, qtd: number, obs: string) {
    addToCart(tenantSlug, mesa, produto, qtd, obs);
    syncCart();
    setProdutoAberto(null);
    setResultado(null);
  }

  return (
    <div
      className="menu-shell min-h-full"
      style={
        {
          "--accent": estabelecimento.cor,
          "--accent-soft": `${estabelecimento.cor}22`,
        } as CSSProperties
      }
    >
      <header className="menu-hero relative overflow-hidden">
        <div className="absolute inset-0">
          {estabelecimento.heroUrl ? (
            <Image
              src={estabelecimento.heroUrl}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          ) : (
            <div className="h-full w-full bg-[var(--hero-fallback)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-[var(--surface)]/55 to-black/25" />
        </div>

        <div className="relative mx-auto flex max-w-3xl flex-col px-4 pb-6 pt-28 sm:px-6">
          <div className="flex items-end gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-[var(--surface)] bg-[var(--accent)] text-2xl font-semibold text-white shadow-lg">
              {estabelecimento.logoUrl ? (
                <Image
                  src={estabelecimento.logoUrl}
                  alt={estabelecimento.nome}
                  width={80}
                  height={80}
                  className="h-full w-full rounded-full object-center border border-red-800"  //logo do estabelecimento - imagem 
                />
              ) : (
                estabelecimento.nome.slice(0, 1)
              )}
            </div>
            <div className="pb-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink)]">
                Mesa {mesa}
              </p>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
                {estabelecimento.nome}
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {estabelecimento.cidade} · Aberto
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-20 border-b border-black/5 bg-[var(--surface)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3 sm:px-6">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
            Grupos
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {nomesCategorias.map((nome) => {
              const ativa = categoriaAtiva === nome;
              return (
                <button
                  key={nome}
                  type="button"
                  onClick={() => setCategoriaAtiva(nome)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium lowercase transition ${
                    ativa
                      ? "bg-[var(--accent)] text-white"
                      : "bg-black/[0.04] text-[var(--ink)] hover:bg-black/[0.07]"
                  }`}
                >
                  {nome}
                </button>
              );
            })}
          </div>
          <label className="relative block">
            <span className="sr-only">Buscar produto</span>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Busque por um produto"
              className="w-full rounded-xl border border-black/8 bg-white px-4 py-2.5 text-sm outline-none ring-[var(--accent)] placeholder:text-[var(--muted)] focus:ring-2"
            />
          </label>
        </div>
      </div>

      <main
        className={`mx-auto max-w-3xl px-4 pb-32 pt-6 sm:px-6 ${
          totalItens > 0 ? "pb-40" : ""
        }`}
      >
        {resultado && (
          <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {resultado}
          </div>
        )}

        {filtradas.length === 0 ? (
          <p className="py-16 text-center text-[var(--muted)]">
            Nenhum produto encontrado.
          </p>
        ) : (
          filtradas.map((cat) => (
            <section key={cat.id ?? cat.nome} className="mb-10">
              <h2 className="font-display mb-4 text-xl font-semibold lowercase text-[var(--ink)]">
                {cat.nome}
              </h2>
              <ul className="flex flex-col gap-3">
                {cat.produtos.map((p) => {
                  const tempo = formatTempoPreparo(
                    p.tempoPreparoMin,
                    p.tempoPreparoMax,
                  );
                  return (
                    <li key={`${cat.id ?? cat.nome}-${p.produto}-${p.barra}`}>
                      <button
                        type="button"
                        onClick={() => setProdutoAberto(p)}
                        className="group flex w-full gap-3 rounded-2xl bg-white p-3 text-left shadow-[0_1px_0_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[var(--ink)]">
                            {p.nome}
                          </p>
                          {p.ingredientes && (
                            <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                              {p.ingredientes}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <p className="text-sm font-semibold text-[var(--accent)]">
                              {formatBRL(p.preco)}
                            </p>
                            {tempo && (
                              <p className="text-xs text-[var(--muted)]">
                                {tempo}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[var(--accent-soft)]">
                          {p.fotoUrl ? (
                            <Image
                              src={p.fotoUrl}
                              alt=""
                              fill
                              className="object-cover transition group-hover:scale-105"
                              sizes="96px"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-[var(--muted)]">
                              Sem foto
                            </div>
                          )}
                          <span className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-lg leading-none text-white shadow">
                            +
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </main>

      {totalItens > 0 && !produtoAberto && (
        <div className="fixed inset-x-0 bottom-0 z-30 p-4">
          <Link
            href={`/m/${mesa}/sacola`}
            className="mx-auto flex w-full max-w-3xl items-center justify-between rounded-2xl bg-[var(--accent)] px-5 py-4 text-white shadow-xl transition hover:brightness-110"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white/20 px-2 text-sm font-semibold">
                {totalItens}
              </span>
              <span className="font-medium">Ver sacola</span>
            </span>
            <span className="font-semibold">{formatBRL(totalValor)}</span>
          </Link>
        </div>
      )}

      {produtoAberto && (
        <ProductDetail
          produto={produtoAberto}
          onClose={() => setProdutoAberto(null)}
          onAdd={addFromDetail}
        />
      )}
    </div>
  );
}