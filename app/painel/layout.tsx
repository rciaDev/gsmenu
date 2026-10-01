import type { CSSProperties } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Painel",
    template: "%s · Painel GSMenu",
  },
  description: "Configuração do cardápio digital GSMenu",
};

export default function PainelRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      style={
        {
          "--painel-bg": "#eef0f2",
          "--painel-sidebar": "#fbfbfc",
          "--accent": "#c45c26",
          "--accent-soft": "#c45c2622",
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
