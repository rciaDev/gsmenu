/** Config da integração GSMarket Central / DataSnap */

export function getCentralBaseUrl(): string {
  return (
    process.env.GSMARKET_CENTRAL_URL?.replace(/\/$/, "") ??
    "http://91.108.125.249:8090"
  );
}

/**
 * true = usa mock local (dev).
 * false = chama Central de verdade (precisa CHAVE + Gateway online).
 */
export function useGsMarketMock(): boolean {
  const v = process.env.GSMARKET_USE_MOCK;
  if (v === "false" || v === "0") return false;
  if (v === "true" || v === "1") return true;
  // default: mock se não houver chave global
  return !process.env.GSMARKET_CHAVE;
}

export function getFotoBaseUrl(): string | null {
  return process.env.GSMARKET_FOTO_BASE?.replace(/\/$/, "") ?? null;
}

/** Padrão GO: EMPRESA=01, CODIGO=012 */
export function sqlEmp(empresa: number): string {
  return `0${empresa}`;
}

export function sqlMesa(mesa: number): string {
  return `0${mesa}`;
}

/**
 * PRODUTOS.CODIGO / MESASITENS.PRODUTO — numérico sem aspas (padrão ComandaADD).
 * Se não for só dígitos, escapa como string.
 */
export function sqlProdutoCodigo(codigo: string): string {
  const t = String(codigo).trim();
  if (/^\d+$/.test(t)) return String(Number(t));
  return `'${escapeSqlString(t)}'`;
}

export function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Prepara SQL para path DataSnap (igual fluxos do GO):
 * - troca / por <*>
 * - encodeURIComponent
 */
export function encodeSqlForPath(sql: string): string {
  const withSlash = sql.replace(/\//g, "<*>");
  return encodeURIComponent(withSlash);
}

export function encodeChaveForPath(chave: string): string {
  return encodeURIComponent(chave);
}
