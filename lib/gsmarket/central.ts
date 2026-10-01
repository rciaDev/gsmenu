import {
  encodeChaveForPath,
  encodeSqlForPath,
  getCentralBaseUrl,
} from "./config";

export class GsMarketOfflineError extends Error {
  status = 503;
  constructor(cnpj: string, detail?: string) {
    super(detail ?? `Gateway offline para CNPJ ${cnpj}`);
    this.name = "GsMarketOfflineError";
  }
}

export class GsMarketApiError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "GsMarketApiError";
    this.status = status;
  }
}

type DatasnapBody = {
  result?: unknown;
  error?: string;
  erro?: string;
};

function pickResult(body: DatasnapBody): unknown {
  if (body.result !== undefined) return body.result;
  return body;
}

/**
 * Normaliza result DataSnap em lista de registros (objetos).
 *
 * Formatos conhecidos:
 * - { result: [ "[{...},{...}]" ] }  ← Central/GO (string JSON)
 * - { result: [ [ {...}, {...} ] ] }
 * - { result: [ {...}, {...} ] }
 */
export function asRecordRows(result: unknown): Record<string, unknown>[] {
  if (result == null) return [];

  let value: unknown = result;

  // result: [ something ]
  if (Array.isArray(value) && value.length === 1) {
    value = value[0];
  }

  // string JSON (array ou objeto)
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith("{") && trimmed.endsWith("}"))
    ) {
      try {
        value = JSON.parse(trimmed) as unknown;
      } catch {
        return [];
      }
    } else {
      return [];
    }
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return [];

    // ainda pode ser [ "[{...}]" ] após um unwrap incompleto
    if (value.length === 1 && typeof value[0] === "string") {
      return asRecordRows(value[0]);
    }

    // [ [ {...} ] ]
    if (Array.isArray(value[0])) {
      return asRecordRows(value[0]);
    }

    return value.filter(
      (r): r is Record<string, unknown> =>
        r != null && typeof r === "object" && !Array.isArray(r),
    );
  }

  if (typeof value === "object") {
    return [value as Record<string, unknown>];
  }

  return [];
}

export function asExecOk(result: unknown): boolean {
  if (result == null) return false;
  if (typeof result === "string") return result.toUpperCase() === "OK";
  if (Array.isArray(result)) {
    const first = result[0];
    if (typeof first === "string") return first.toUpperCase() === "OK";
    if (Array.isArray(first) && typeof first[0] === "string") {
      return first[0].toUpperCase() === "OK";
    }
  }
  return false;
}

export function cell(
  row: Record<string, unknown>,
  ...keys: string[]
): unknown {
  for (const key of keys) {
    if (key in row) return row[key];
    const found = Object.keys(row).find(
      (k) => k.toUpperCase() === key.toUpperCase(),
    );
    if (found) return row[found];
  }
  return undefined;
}

export function cellStr(
  row: Record<string, unknown>,
  ...keys: string[]
): string {
  const v = cell(row, ...keys);
  if (v == null) return "";
  return String(v).trim();
}

export function cellNum(
  row: Record<string, unknown>,
  ...keys: string[]
): number {
  const v = cell(row, ...keys);
  if (v == null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function centralGet(
  path: string,
  cnpj: string,
): Promise<{ status: number; body: DatasnapBody; text: string }> {
  const url = `${getCentralBaseUrl()}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-CNPJ": cnpj,
      },
      cache: "no-store",
    });
  } catch (err) {
    throw new GsMarketApiError(
      `Falha de rede com a Central: ${err instanceof Error ? err.message : String(err)}`,
      502,
    );
  }

  const text = await res.text();
  let body: DatasnapBody = {};
  try {
    body = text ? (JSON.parse(text) as DatasnapBody) : {};
  } catch {
    body = { erro: text.slice(0, 200) };
  }

  if (res.status === 503) {
    throw new GsMarketOfflineError(
      cnpj,
      body.erro ?? body.error ?? "Gateway offline",
    );
  }

  return { status: res.status, body, text };
}

/** GET .../ConsultaSQL/{sql} */
export async function consultaSQL(
  cnpj: string,
  sql: string,
): Promise<Record<string, unknown>[]> {
  const encoded = encodeSqlForPath(sql);
  const path = `/datasnap/rest/TServerMethods1/ConsultaSQL/${encoded}`;
  const { status, body, text } = await centralGet(path, cnpj);

  if (status >= 400) {
    throw new GsMarketApiError(
      body.erro ?? body.error ?? `ConsultaSQL HTTP ${status}: ${text.slice(0, 180)}`,
      status >= 500 ? 502 : status,
    );
  }

  return asRecordRows(pickResult(body));
}

/** GET .../ExecutaSQLApp/{chave}/{sql} — espera result OK */
export async function executaSQLApp(
  cnpj: string,
  chave: string,
  sql: string,
): Promise<void> {
  const path = `/datasnap/rest/TServerMethods1/ExecutaSQLApp/${encodeChaveForPath(chave)}/${encodeSqlForPath(sql)}`;
  const { status, body, text } = await centralGet(path, cnpj);

  if (status >= 400) {
    throw new GsMarketApiError(
      body.erro ?? body.error ?? `ExecutaSQLApp HTTP ${status}: ${text.slice(0, 180)}`,
      status >= 500 ? 502 : status,
    );
  }

  const result = pickResult(body);
  if (!asExecOk(result)) {
    // Alguns retornos trazem mensagem no result
    const msg =
      typeof result === "string"
        ? result
        : Array.isArray(result)
          ? String(result[0])
          : text.slice(0, 180);
    throw new GsMarketApiError(
      `ExecutaSQLApp não retornou OK: ${msg || "resposta vazia"}`,
      502,
    );
  }
}
