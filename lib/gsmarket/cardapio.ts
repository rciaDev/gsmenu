import {
  CATEGORIAS_FIXAS,
  resolveCategoriaFixa,
} from "@/lib/categorias";
import type { CardapioResponse, Categoria, Produto } from "@/lib/types";
import type { TenantRecord } from "@/lib/tenants";
import { consultaSQL, cellNum, cellStr } from "./central";
import { getFotoBaseUrl, sqlEmp } from "./config";

function buildFotoUrl(arq: string, barra: string): string | null {
  const base = getFotoBaseUrl();
  if (!base) return null;
  const file = (arq || barra || "").replace(/\.(jpg|jpeg|png|webp)$/i, "");
  if (!file) return null;
  return `${base}/${file}.jpg`;
}


function normCode(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  const stripped = t.replace(/^0+(?=\d)/, "");
  return stripped || t;
}

function slugCat(nome: string): string {
  return (
    nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "outras"
  );
}

type BarraRow = { barra: string; barraNorm: string; principal: boolean };

type CatBucket = { id: string; nome: string; produtos: Produto[] };

/**
 * Cardápio LISTASITE='S' — preços via PRODUTOSPRECO (EMPRESA+PRODUTO+BARRA).
 * Categorias fixas quando der match; demais usam o nome do ERP (não descarta).
 */


export async function fetchCardapioFromGsMarket(
  tenant: TenantRecord,
): Promise<CardapioResponse> {
  const emp = sqlEmp(tenant.empresa);

  // CODIGO = chave do ERP (MESASITENS.PRODUTO / JOIN do GO). Não usar NOME.
  const sqlProdutos = `
SELECT
  P.CODIGO,
  P.NOME,
  P.INGREDIENTES,
  P.CATEGORIA,
  P.ARQ_IMAGEM
FROM PRODUTOS P
WHERE P.LISTASITE = 'S'
  AND P.EMPRESA = ${emp}
ORDER BY P.CATEGORIA, P.NOME
`.trim();

  const rows = await consultaSQL(tenant.cnpj, sqlProdutos);

  const catNomeByCodigo = new Map<string, string>();
  try {
    const catRows = await consultaSQL(
      tenant.cnpj,
      `SELECT CODIGO, NOME FROM PRODUTOSCAT`,
    );
    for (const c of catRows) {
      const cod = cellStr(c, "CODIGO");
      const nome = cellStr(c, "NOME");
      if (!cod || !nome) continue;
      catNomeByCodigo.set(cod, nome);
      catNomeByCodigo.set(normCode(cod), nome);
    }
  } catch (err) {
    console.warn("[GSMenu] PRODUTOSCAT indisponível:", err);
  }

  const barrasByProduto = new Map<string, BarraRow[]>();
  try {
    const barraRows = await consultaSQL(
      tenant.cnpj,
      `
SELECT FIRST 8000 CODIGO, BARRA, PRINCIPAL
FROM PRODUTOSBARRA
`.trim(),
    );
    for (const b of barraRows) {
      const prod = cellStr(b, "CODIGO", "PRODUTO");
      const barra = cellStr(b, "BARRA");
      if (!prod || !barra) continue;
      const prodNorm = normCode(prod);
      const principal = cellStr(b, "PRINCIPAL").toUpperCase() === "S";
      const row: BarraRow = {
        barra,
        barraNorm: normCode(barra),
        principal,
      };
      for (const key of new Set([prod, prodNorm])) {
        const list = barrasByProduto.get(key) ?? [];
        list.push(row);
        barrasByProduto.set(key, list);
      }
    }
    for (const [prod, list] of barrasByProduto) {
      list.sort((a, b) => Number(b.principal) - Number(a.principal));
      barrasByProduto.set(prod, list);
    }
  } catch (err) {
    console.warn("[GSMenu] PRODUTOSBARRA indisponível:", err);
  }

  const precoByProdutoBarra = new Map<
    string,
    { preco: number; barra: string }
  >();
  const precosByProduto = new Map<
    string,
    { barra: string; preco: number }[]
  >();

  try {
    const precoRows = await consultaSQL(
      tenant.cnpj,
      `
SELECT PRODUTO, BARRA, PRECO
FROM PRODUTOSPRECO
WHERE EMPRESA = ${emp}
`.trim(),
    );
    for (const p of precoRows) {
      const prod = cellStr(p, "PRODUTO", "CODIGO");
      const barra = cellStr(p, "BARRA");
      const preco = cellNum(p, "PRECO");
      if (!prod || !barra || preco <= 0) continue;
      const prodNorm = normCode(prod);
      const barraNorm = normCode(barra);
      const key = `${prodNorm}|${barraNorm}`;
      if (!precoByProdutoBarra.has(key)) {
        precoByProdutoBarra.set(key, { preco, barra });
      }
      const list = precosByProduto.get(prodNorm) ?? [];
      list.push({ barra, preco });
      precosByProduto.set(prodNorm, list);
    }
  } catch (err) {
    console.warn("[GSMenu] PRODUTOSPRECO indisponível:", err);
  }

  function pickBarraEPreco(
    produto: string,
  ): { barra: string; preco: number } | null {
    const prodNorm = normCode(produto);
    const barras =
      barrasByProduto.get(produto) ??
      barrasByProduto.get(prodNorm) ??
      [];

    for (const b of barras) {
      const hit =
        precoByProdutoBarra.get(`${prodNorm}|${b.barraNorm}`) ??
        precoByProdutoBarra.get(`${prodNorm}|${normCode(b.barra)}`);
      if (hit) return { barra: b.barra, preco: hit.preco };
    }

    const any = precosByProduto.get(prodNorm);
    if (any?.length) {
      return { barra: any[0].barra, preco: any[0].preco };
    }
    return null;
  }

  const buckets = new Map<string, CatBucket>();
  for (const cat of CATEGORIAS_FIXAS) {
    buckets.set(cat.id, { id: cat.id, nome: cat.nome, produtos: [] });
  }

  const seenProduto = new Set<string>();
  let semPreco = 0;
  let emFixa = 0;
  let emOutra = 0;

  for (const row of rows) {
    // Sempre PRODUTOS.CODIGO — o GO faz JOIN P.CODIGO = MESASITENS.PRODUTO
    const produto = cellStr(row, "CODIGO", "PRODUTO");
    if (!produto) continue;
    const prodKey = normCode(produto) || produto;
    if (seenProduto.has(prodKey)) continue;
    seenProduto.add(prodKey);

    const picked = pickBarraEPreco(produto);
    if (!picked) {
      semPreco += 1;
      continue;
    }

    const catCod = cellStr(row, "CATEGORIA");
    const catNomeGs =
      (catCod &&
        (catNomeByCodigo.get(catCod) ||
          catNomeByCodigo.get(normCode(catCod)))) ||
      "";
    const nomeProduto = cellStr(row, "NOME") || produto;

    const fixa = resolveCategoriaFixa({
      catNome: catNomeGs,
      catCodigo: catCod,
      produtoNome: nomeProduto,
    });

    let bucketId: string;
    let bucketNome: string;
    if (fixa) {
      bucketId = fixa.id;
      bucketNome = fixa.nome;
      emFixa += 1;
    } else {
      bucketNome = catNomeGs.trim() || "Outras";
      bucketId = `erp-${slugCat(bucketNome)}`;
      emOutra += 1;
    }

    if (!buckets.has(bucketId)) {
      buckets.set(bucketId, {
        id: bucketId,
        nome: bucketNome,
        produtos: [],
      });
    }

    const arq = cellStr(row, "ARQ_IMAGEM");
    buckets.get(bucketId)!.produtos.push({
      produto,
      barra: picked.barra,
      nome: nomeProduto,
      ingredientes: cellStr(row, "INGREDIENTES") || null,
      preco: picked.preco,
      fotoUrl: buildFotoUrl(arq, picked.barra),
      visivelNoSite: true,
    });
  }

  // Ordem: categorias fixas (mesmo vazias omitidas), depois demais do ERP
  const fixasIds = new Set<string>(CATEGORIAS_FIXAS.map((c) => c.id));
  const categorias: Categoria[] = [
    ...CATEGORIAS_FIXAS.map((cat) => buckets.get(cat.id)!).filter(
      (b) => b.produtos.length > 0,
    ),
    ...[...buckets.values()]
      .filter((b) => !fixasIds.has(b.id) && b.produtos.length > 0)
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
  ].map((b) => ({
    id: b.id,
    nome: b.nome.toLocaleLowerCase("pt-BR"),
    produtos: b.produtos,
  }));

  if (process.env.NODE_ENV === "development") {
    const comPreco = categorias.reduce((n, c) => n + c.produtos.length, 0);
    console.info(
      `[GSMenu cardápio] emp=${emp} produtos=${seenProduto.size} comPreco=${comPreco} emFixa=${emFixa} emOutra=${emOutra} grupos=${categorias.length} semPreco=${semPreco} precosMap=${precoByProdutoBarra.size}`,
    );
  }

  return {
    estabelecimento: {
      nome: tenant.nome,
      logoUrl: tenant.logoUrl,
      heroUrl: tenant.heroUrl,
      cor: tenant.cor,
      cidade: tenant.cidade,
    },
    categorias,
  };
}
