import type { TenantRecord } from "@/lib/tenants";

/**
 * Mesas para QR Codes / validação de URL.
 *
 * A tabela MESAS do GSMarket guarda comandas (abertas/usadas), não o
 * cadastro físico 1..N — listar dali pulava números (ex.: 8 → 10).
 * Usamos a quantidade configurada do tenant (qtdMesas).
 */
export async function fetchMesasFromGsMarket(
  tenant: TenantRecord,
): Promise<number[]> {
  const max = Math.max(1, tenant.qtdMesas || 20);
  return Array.from({ length: max }, (_, i) => i + 1);
}

export async function mesaExisteNoGsMarket(
  tenant: TenantRecord,
  mesa: number,
): Promise<boolean> {
  if (!Number.isInteger(mesa) || mesa < 1) return false;
  const max = Math.max(1, tenant.qtdMesas || 20);
  return mesa <= max;
}
