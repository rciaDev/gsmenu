import type { Produto } from "@/lib/types";

export type CartLine = {
  key: string;
  produto: Produto;
  qtd: number;
  obs: string;
};

export type CartState = {
  lines: CartLine[];
  obsGeral: string;
};

function storageKey(tenantSlug: string, mesa: number) {
  return `gsmenu:cart:${tenantSlug}:m${mesa}`;
}

export function cartLineKey(produtoCodigo: string, obs: string) {
  return `${produtoCodigo}::${obs.trim().toLowerCase()}`;
}

export function readCart(tenantSlug: string, mesa: number): CartState {
  if (typeof window === "undefined") return { lines: [], obsGeral: "" };
  try {
    const raw = sessionStorage.getItem(storageKey(tenantSlug, mesa));
    if (!raw) return { lines: [], obsGeral: "" };
    const parsed = JSON.parse(raw) as CartState;
    if (!Array.isArray(parsed.lines)) return { lines: [], obsGeral: "" };
    return {
      lines: parsed.lines,
      obsGeral: typeof parsed.obsGeral === "string" ? parsed.obsGeral : "",
    };
  } catch {
    return { lines: [], obsGeral: "" };
  }
}

export function writeCart(
  tenantSlug: string,
  mesa: number,
  state: CartState,
) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(storageKey(tenantSlug, mesa), JSON.stringify(state));
  window.dispatchEvent(
    new CustomEvent("gsmenu:cart", { detail: { tenantSlug, mesa } }),
  );
}

export function clearCart(tenantSlug: string, mesa: number) {
  writeCart(tenantSlug, mesa, { lines: [], obsGeral: "" });
}

export function addToCart(
  tenantSlug: string,
  mesa: number,
  produto: Produto,
  qtd: number,
  obs: string,
) {
  const state = readCart(tenantSlug, mesa);
  const key = cartLineKey(produto.produto, obs);
  const existing = state.lines.find((l) => l.key === key);
  const lines = existing
    ? state.lines.map((l) =>
        l.key === key ? { ...l, qtd: l.qtd + qtd } : l,
      )
    : [...state.lines, { key, produto, qtd, obs }];
  writeCart(tenantSlug, mesa, { ...state, lines });
}

export function setCartLineQty(
  tenantSlug: string,
  mesa: number,
  key: string,
  qtd: number,
) {
  const state = readCart(tenantSlug, mesa);
  const lines = state.lines
    .map((l) => (l.key === key ? { ...l, qtd } : l))
    .filter((l) => l.qtd > 0);
  writeCart(tenantSlug, mesa, { ...state, lines });
}

export function setCartObsGeral(
  tenantSlug: string,
  mesa: number,
  obsGeral: string,
) {
  const state = readCart(tenantSlug, mesa);
  writeCart(tenantSlug, mesa, { ...state, obsGeral });
}
