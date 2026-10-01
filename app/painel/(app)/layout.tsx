import { PainelShell } from "@/app/painel/_components/painel-shell";

export default function PainelAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PainelShell>{children}</PainelShell>;
}
