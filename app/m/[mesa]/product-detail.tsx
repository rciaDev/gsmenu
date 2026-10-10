"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { formatBRL, formatTempoPreparo } from "@/lib/format";
import type { Produto } from "@/lib/types";

const DESC_PREVIEW = 120;

type Props = {
  produto: Produto;
  onClose: () => void;
  onAdd: (produto: Produto, qtd: number, obs: string) => void;
};

function parseItens(ingredientes: string | null | undefined) {
  return (ingredientes ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ProductDetail({ produto, onClose, onAdd }: Props) {
  const [qtd, setQtd] = useState(1);
  const [verMais, setVerMais] = useState(false);
  const titleId = useId();
  const tempo = formatTempoPreparo(
    produto.tempoPreparoMin,
    produto.tempoPreparoMax,
  );
  const desc = produto.ingredientes?.trim() ?? "";
  const itens = parseItens(produto.ingredientes);
  const [selecionados, setSelecionados] = useState<Set<string>>(
    () => new Set(itens),
  );
  const precisaVerMais = desc.length > DESC_PREVIEW;
  const descVisivel =
    !precisaVerMais || verMais ? desc : `${desc.slice(0, DESC_PREVIEW).trim()}…`;

  function toggleItem(item: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  }

  const removidos = itens.filter((item) => !selecionados.has(item));
  const obs = removidos.length
    ? `Sem ${removidos.map((r) => r.toLowerCase()).join(", ")}`
    : "";

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const total = produto.preco * qtd;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="flex h-full w-full max-w-lg flex-col bg-[var(--surface)] shadow-2xl sm:my-4 sm:h-[min(100%,920px)] sm:overflow-hidden sm:rounded-3xl">
        <header className="relative z-10 flex shrink-0 items-center justify-center border-b border-black/5 bg-white px-12 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[var(--ink)] hover:bg-black/5"
            aria-label="Voltar"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h2 id={titleId} className="text-base font-semibold text-[var(--ink)]">
            Detalhe do produto
          </h2>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="relative aspect-[4/3] w-full bg-[var(--accent-soft)]">
            {produto.fotoUrl ? (
              <Image
                src={produto.fotoUrl}
                alt={produto.nome}
                fill
                className="object-cover"
                sizes="(max-width: 512px) 100vw, 512px"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
                Sem foto
              </div>
            )}
          </div>

          <div className="bg-white px-5 pb-4 pt-5">
            <h3 className="font-display text-2xl font-semibold tracking-tight text-[var(--ink)]">
              {produto.nome}
            </h3>
            {desc && (
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {descVisivel}
                {precisaVerMais && (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={() => setVerMais((v) => !v)}
                      className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                    >
                      {verMais ? "Ver menos" : "Ver mais"}
                    </button>
                  </>
                )}
              </p>
            )}
            <p className="mt-3 text-lg font-semibold text-[var(--ink)]">
              {formatBRL(produto.preco)}
            </p>
            {tempo && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-3 py-1 text-xs font-medium text-[var(--muted)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
                  <path
                    d="M12 7v5l3 2"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
                Preparo {tempo}
              </p>
            )}
          </div>

          <div
            className="h-3 bg-[var(--surface)]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 10px 0, transparent 6px, white 6.5px)",
              backgroundSize: "20px 12px",
              backgroundPosition: "center top",
              backgroundRepeat: "repeat-x",
            }}
            aria-hidden
          />


          {itens.length > 0 && (
            <div className="bg-[var(--surface)] px-5 pb-28 pt-2">
              <h4 className="text-base font-semibold text-[var(--ink)]">
                Observações
              </h4>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Desmarque o que deseja remover
              </p>
              <ul className="mt-3 space-y-1">
                {itens.map((item, i) => {
                  const checked = selecionados.has(item);
                  return (
                    <li key={`${item}-${i}`}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl px-1 py-2.5 active:bg-black/[0.03]">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                            checked
                              ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                              : "border-black/25 bg-white"
                          }`}
                          aria-hidden
                        >
                          {checked && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M5 12l5 5L20 7"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => toggleItem(item)}
                        />
                        <span
                          className={`text-sm capitalize text-[var(--ink)] ${
                            checked ? "" : "line-through opacity-45"
                          }`}
                        >
                          {item}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
                Remoções sem cobrança adicional. Para trocas ou acréscimos,
                converse diretamente com o estabelecimento.
              </p>
              
              <div className="mt-3">
                <h5 className="text-sm font-semibold text-[var(--ink)]">
                  Itens removidos
                </h5>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {removidos.join(", ")}
                </p>
              </div>
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-black/5 bg-white px-4 py-3 safe-pb">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-xl bg-black/[0.04] p-1">
              <button
                type="button"
                aria-label="Diminuir quantidade"
                disabled={qtd <= 1}
                onClick={() => setQtd((n) => Math.max(1, n - 1))}
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-xl font-medium text-[var(--ink)] shadow-sm disabled:opacity-40"
              >
                −
              </button>
              <span className="w-8 text-center text-base font-semibold tabular-nums">
                {qtd}
              </span>
              <button
                type="button"
                aria-label="Aumentar quantidade"
                onClick={() => setQtd((n) => n + 1)}
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--ink)] text-xl font-medium text-white"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => onAdd(produto, qtd, obs)}
              className="flex flex-1 items-center justify-center rounded-xl bg-[var(--ink)] px-4 py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Adicionar {formatBRL(total)}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}


