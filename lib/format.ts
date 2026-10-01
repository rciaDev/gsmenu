export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Ex.: "15–25 min" | "20 min" | null se sem dados */
export function formatTempoPreparo(
  min?: number | null,
  max?: number | null,
): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max) {
    return `${min}–${max} min`;
  }
  const unico = min ?? max;
  return unico != null ? `${unico} min` : null;
}
