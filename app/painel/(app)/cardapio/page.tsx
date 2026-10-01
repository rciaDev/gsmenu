"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatBRL, formatTempoPreparo } from "@/lib/format";
import type { Categoria, Produto } from "@/lib/types";
import {
  GhostButton,
  PageHeader,
  PanelCard,
  PrimaryButton,
} from "@/app/painel/_components/ui";

type CardapioApi = {
  estabelecimento?: { nome: string };
  categorias?: Categoria[];
  source?: string;
  error?: string;
};

export default function CardapioPainelPage() {
  const [grupos, setGrupos] = useState<Categoria[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [grupoAtivo, setGrupoAtivo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch("/api/cardapio", { cache: "no-store" });
      const data = (await res.json()) as CardapioApi;
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível carregar o cardápio.");
        setGrupos([]);
        return;
      }
      const cats = data.categorias ?? [];
      setGrupos(cats);
      setSource(data.source ?? null);
      setGrupoAtivo((prev) => {
        if (prev && cats.some((g) => (g.id ?? g.nome) === prev)) return prev;
        return cats[0] ? (cats[0].id ?? cats[0].nome) : "";
      });
    } catch {
      setErro("Falha de rede ao buscar o cardápio.");
      setGrupos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const grupo =
    grupos.find((g) => (g.id ?? g.nome) === grupoAtivo) ?? grupos[0] ?? null;

  return (
    <div>
      <PageHeader
        title="Cardápio"
        description="Produtos com LISTASITE = S, agrupados nas categorias fixas (Lanches, Pizza, Água, Refri, Cerveja, Whisky, Porções)."
        actions={
          <>
            <GhostButton onClick={load} disabled={loading}>
              Atualizar
            </GhostButton>
            <Link
              href="/m/1"
              target="_blank"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Ver no site
            </Link>
          </>
        }
      />

      {source && (
        <p className="mb-4 text-xs text-[var(--muted)]">
          Fonte: {source === "gsmarket" ? "GSMarket Central" : "mock local"}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Carregando cardápio…</p>
      ) : erro ? (
        <PanelCard className="py-12 text-center">
          <p className="font-display text-lg font-semibold">Cardápio indisponível</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">{erro}</p>
          <PrimaryButton className="mt-5" onClick={load}>
            Tentar de novo
          </PrimaryButton>
        </PanelCard>
      ) : grupos.length === 0 ? (
        <PanelCard className="py-12 text-center">
          <p className="text-sm text-[var(--muted)]">
            Nenhum produto com LISTASITE = S encontrado.
          </p>
        </PanelCard>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Grupos
            </p>
            <ul className="flex flex-col gap-1">
              {grupos.map((g) => {
                const key = g.id ?? g.nome;
                const ativa = key === (grupo ? grupo.id ?? grupo.nome : "");
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => setGrupoAtivo(key)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        ativa
                          ? "bg-white font-medium shadow-sm ring-1 ring-black/8"
                          : "hover:bg-black/[0.03]"
                      }`}
                    >
                      <span className="truncate lowercase">{g.nome}</span>
                      <span className="text-xs text-[var(--muted)]">
                        {g.produtos.length}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <PanelCard className="!p-0 overflow-hidden">
            {!grupo ? (
              <div className="px-5 py-16 text-center text-sm text-[var(--muted)]">
                Selecione um grupo.
              </div>
            ) : (
              <>
                <div className="border-b border-black/6 px-5 py-4">
                  <h2 className="font-display text-lg font-semibold lowercase">
                    {grupo.nome}
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    {grupo.produtos.length}{" "}
                    {grupo.produtos.length === 1 ? "item" : "itens"}
                  </p>
                </div>
                {grupo.produtos.length === 0 ? (
                  <p className="px-5 py-14 text-center text-sm text-[var(--muted)]">
                    Nenhum produto neste grupo.
                  </p>
                ) : (
                  <ul className="divide-y divide-black/5">
                    {grupo.produtos.map((p: Produto) => {
                      const tempo = formatTempoPreparo(
                        p.tempoPreparoMin,
                        p.tempoPreparoMax,
                      );
                      return (
                        <li
                          key={`${grupo.id ?? grupo.nome}-${p.produto}-${p.barra}`}
                          className="flex flex-wrap items-center gap-4 px-5 py-4"
                        >
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--painel-bg)] text-[10px] text-[var(--muted)]">
                            {p.fotoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.fotoUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              "Foto"
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{p.nome}</p>
                            <p className="mt-0.5 line-clamp-1 text-sm text-[var(--muted)]">
                              {p.ingredientes ?? "Sem descrição"}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                              <span className="font-medium text-[var(--ink)]">
                                {formatBRL(p.preco)}
                              </span>
                              {tempo && <span>Preparo {tempo}</span>}
                              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-600">
                                #{p.produto}
                              </span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </PanelCard>
        </div>
      )}
    </div>
  );
}
