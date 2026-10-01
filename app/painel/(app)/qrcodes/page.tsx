"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GhostButton,
  PageHeader,
  PanelCard,
} from "@/app/painel/_components/ui";

export default function QrCodesPage() {
  const [mesas, setMesas] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/painel/mesas");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErro(data.error ?? "Falha ao carregar mesas");
      setMesas([]);
      return;
    }
    setErro(null);
    setMesas(data.mesas ?? []);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const ordenadas = useMemo(
    () => [...mesas].sort((a, b) => a - b),
    [mesas],
  );

  function flash(msg: string) {
    setFeedback(msg);
    window.setTimeout(() => setFeedback(null), 3200);
  }

  function baixarPng(codigo: number) {
    window.location.href = `/api/painel/mesas/${codigo}/qr`;
  }

  function baixarTodos() {
    for (const codigo of ordenadas) {
      const a = document.createElement("a");
      a.href = `/api/painel/mesas/${codigo}/qr`;
      a.download = `mesa-${codigo}.png`;
      a.click();
    }
    flash(`Download de ${ordenadas.length} QR Codes iniciado.`);
  }

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Carregando mesas…</p>;
  }

  return (
    <div>
      <PageHeader
        title="QR Codes"
        description="Mesas do estabelecimento (1 até a quantidade configurada). Gere e baixe o QR Code de cada uma."
        actions={
          <GhostButton onClick={baixarTodos} disabled={mesas.length === 0}>
            Baixar todos (PNG)
          </GhostButton>
        }
      />

      <PanelCard className="mb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-[var(--muted)]">
              Cadastradas:{" "}
              <strong className="text-[var(--ink)]">{mesas.length} mesas</strong>
              {mesas.length > 0 && (
                <>
                  {" · "}
                  Números{" "}
                  <strong className="text-[var(--ink)]">
                    {Math.min(...mesas)}–{Math.max(...mesas)}
                  </strong>
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Link: /m/número-da-mesa
            </p>
          </div>
          <GhostButton onClick={() => load()}>Atualizar lista</GhostButton>
        </div>
        {feedback && (
          <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {feedback}
          </p>
        )}
        {erro && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
            {erro}
          </p>
        )}
      </PanelCard>

      {ordenadas.length === 0 && !erro ? (
        <PanelCard className="py-12 text-center">
          <p className="text-[var(--muted)]">
            Nenhuma mesa configurada.
          </p>
        </PanelCard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {ordenadas.map((codigo) => (
            <PanelCard
              key={codigo}
              className="relative flex flex-col items-center text-center"
            >
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl bg-[var(--painel-bg)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/painel/mesas/${codigo}/qr`}
                  alt={`QR mesa ${codigo}`}
                  className="h-24 w-24"
                />
              </div>
              <p className="mt-3 font-semibold">Mesa {codigo}</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">/m/{codigo}</p>
              <button
                type="button"
                onClick={() => baixarPng(codigo)}
                className="mt-3 text-xs font-medium text-[var(--accent)] hover:underline"
              >
                Baixar PNG
              </button>
            </PanelCard>
          ))}
        </div>
      )}
    </div>
  );
}

