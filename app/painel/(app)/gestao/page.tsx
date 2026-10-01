"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Field,
  GhostButton,
  inputClass,
  PageHeader,
  PanelCard,
  PrimaryButton,
} from "@/app/painel/_components/ui";

type Config = {
  nome: string;
  cidade: string;
  cor: string;
  logoUrl: string | null;
  heroUrl: string | null;
  qtdMesas: number;
};

export default function GestaoPage() {
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [cor, setCor] = useState("#C45C26");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const [qtdMesas, setQtdMesas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [salvo, setSalvo] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const heroFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/painel/config")
      .then(async (res) => {
        if (!res.ok) throw new Error("auth");
        return res.json() as Promise<Config>;
      })
      .then((cfg) => {
        setNome(cfg.nome);
        setCidade(cfg.cidade);
        setCor(cfg.cor);
        setLogoUrl(cfg.logoUrl);
        setHeroUrl(cfg.heroUrl);
      })
      .catch(() => setFeedback("Não foi possível carregar as configurações."))
      .finally(() => setLoading(false));
    fetch("/api/painel/mesas")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setQtdMesas(data.qtdMesas ?? data.mesas?.length ?? 0);
      });
  }, []);

  async function salvar() {
    setFeedback(null);
    const res = await fetch("/api/painel/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, cidade, cor }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFeedback(data.error ?? "Não foi possível salvar");
      return;
    }
    setSalvo(true);
    setFeedback("Configurações salvas.");
    window.setTimeout(() => {
      setSalvo(false);
      setFeedback(null);
    }, 2500);
  }

  async function uploadImage(
    endpoint: "/api/painel/logo" | "/api/painel/hero",
    file: File | null,
  ) {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(endpoint, { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) {
      setFeedback(data.error ?? "Falha no upload");
      return;
    }
    if (endpoint === "/api/painel/logo") {
      setLogoUrl(data.logoUrl);
      setFeedback("Logo atualizada.");
    } else {
      setHeroUrl(data.heroUrl);
      setFeedback("Imagem de fundo atualizada.");
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-[var(--muted)]">Carregando configurações…</p>
    );
  }

  return (
    <div>
      <PageHeader
        title="Gestão"
        description="Dados do estabelecimento, identidade visual e mesas (via QR Codes)."
        actions={
          <PrimaryButton onClick={salvar}>
            {salvo ? "Salvo" : "Salvar alterações"}
          </PrimaryButton>
        }
      />

      {feedback && (
        <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {feedback}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <PanelCard className="flex flex-col gap-5">
          <h2 className="font-display text-lg font-semibold">Estabelecimento</h2>
          <Field label="Nome">
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Cidade / região">
            <input
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="rounded-xl border border-black/8 bg-[var(--painel-bg)] px-4 py-3">
            <p className="text-sm font-medium text-[var(--ink)]">Mesas / QR Codes</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
              As mesas seguem a quantidade do estabelecimento (1, 2, 3…). Na
              tela de{" "}
              <Link
                href="/painel/qrcodes"
                className="font-medium text-[var(--accent)] hover:underline"
              >
                QR Codes
              </Link>{" "}
              você gera e baixa os códigos.
            </p>
            <p className="mt-2 text-sm text-[var(--ink)]">
              Cadastradas: <strong>{qtdMesas}</strong> mesas
            </p>
          </div>
          <Field label="Cor de destaque" hint="Usada em botões e destaques do cardápio.">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="h-11 w-14 cursor-pointer rounded-lg border border-black/10 bg-white p-1"
              />
              <input
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className={inputClass}
              />
            </div>
          </Field>
        </PanelCard>

        <div className="flex flex-col gap-6">
          <PanelCard>
            <h2 className="font-display text-lg font-semibold">Logomarca</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Ícone circular exibido sobre o fundo do cardápio.
            </p>
            <div className="mt-4 flex aspect-square max-w-[180px] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-black/15 bg-[var(--painel-bg)] text-sm text-[var(--muted)]">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-full w-full object-cover"
                />
              ) : (
                "Sem logo"
              )}
            </div>
            <input
              ref={logoFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                uploadImage("/api/painel/logo", e.target.files?.[0] ?? null)
              }
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <GhostButton onClick={() => logoFileRef.current?.click()}>
                Escolher arquivo
              </GhostButton>
            </div>
          </PanelCard>

          <PanelCard>
            <h2 className="font-display text-lg font-semibold">
              Imagem de fundo
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Foto larga que aparece atrás da logo no topo do cardápio.
            </p>
            <div className="mt-4 flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-black/15 bg-[var(--painel-bg)] text-sm text-[var(--muted)]">
              {heroUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroUrl}
                  alt="Fundo do cardápio"
                  className="h-full w-full object-cover"
                />
              ) : (
                "Sem imagem de fundo"
              )}
            </div>
            <input
              ref={heroFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                uploadImage("/api/painel/hero", e.target.files?.[0] ?? null)
              }
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <GhostButton onClick={() => heroFileRef.current?.click()}>
                Escolher arquivo
              </GhostButton>
            </div>
          </PanelCard>

          <PanelCard>
            <h2 className="font-display text-lg font-semibold">Prévia</h2>
            <div className="relative mt-4 overflow-hidden rounded-2xl">
              <div className="absolute inset-0">
                {heroUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={heroUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full" style={{ background: cor }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/20" />
              </div>
              <div className="relative p-4 pt-16 text-white">
                <div className="flex items-end gap-3">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-white/40"
                    />
                  ) : (
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold ring-2 ring-white/40"
                      style={{ background: cor }}
                    >
                      {nome.slice(0, 1) || "G"}
                    </div>
                  )}
                  <div className="pb-0.5">
                    <p className="text-xs uppercase tracking-wider opacity-80">
                      Cardápio
                    </p>
                    <p className="font-display text-xl font-semibold">{nome}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm opacity-90">{cidade}</p>
                <p className="mt-2 text-xs opacity-80">{qtdMesas} mesas</p>
              </div>
            </div>
          </PanelCard>
        </div>
      </div>
    </div>
  );
}
