import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="font-display text-2xl font-semibold">Página não encontrada</h1>
      <p className="mt-2 text-[var(--muted)]">
        Mesa inválida ou fora da quantidade configurada para este estabelecimento.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-2xl bg-[var(--accent)] px-5 py-3 font-semibold text-white"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
