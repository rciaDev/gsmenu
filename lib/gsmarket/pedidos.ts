import type { PedidoItemInput } from "@/lib/types";
import type { TenantRecord } from "@/lib/tenants";
import { consultaSQL, cellNum, cellStr, executaSQLApp } from "./central";
import { escapeSqlString, sqlEmp, sqlMesa, sqlProdutoCodigo } from "./config";
import { ignoreListAnonymousStackFramesIfSandwiched } from "next/dist/next-devtools/server/shared";
import { Sirivennela } from "next/font/google";
import { isResolvedLazyResult } from "next/dist/server/lib/lazy-result";
import { OutletBoundary } from "next/dist/lib/framework/boundary-components";

export type EnviarPedidoResult = {
  mesa: number;
  itensInseridos: number;
  total: number;
  mesaAbertaAntes: boolean;
};

async function mesaEstaAberta(
  tenant: TenantRecord,
  mesa: number,
): Promise<boolean> {
  const sql = `SELECT FIRST 1 STATUS FROM MESAS WHERE EMPRESA=${sqlEmp(tenant.empresa)} AND CODIGO=${sqlMesa(mesa)}`;
  const rows = await consultaSQL(tenant.cnpj, sql);
  if (rows.length === 0) return false;
  return cellStr(rows[0], "STATUS").toUpperCase() === "A";
}

/**
 * Abre mesa se necessário.
 * NÃO zera MESASITENS (diferente do "cadastrar mesa" do ComandaADD).
 */
async function garantirMesaAberta(
  tenant: TenantRecord,
  chave: string,
  mesa: number,
): Promise<void> {
  const emp = sqlEmp(tenant.empresa);
  const cod = sqlMesa(mesa);
  const sql = `
        UPDATE OR INSERT INTO MESAS(
          EMPRESA,CODIGO,STATUS,DATA,HORA,ATENDENTE,COMANDA,
          TOTAL,DESCONTO,ACRESCIMO,VRFRETE,VRSEGURO,VROUTROS,VALOR,
          CLIENTE,CLI_CPF,CLI_NOME,CLI_CEP,CLI_CIDADE,CLI_UF,
          CLI_ENDERECO,CLI_NUMERO,CLI_BAIRRO,CLI_FONE,CLI_CELU
        ) VALUES(
          ${emp},${cod},'A',(CURRENT_DATE),(CURRENT_TIME),0,'${mesa}',
          0,0,0,0,0,0,0,
          NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL
        )
        `.trim();
          await executaSQLApp(tenant.cnpj, chave, sql);
        }

async function inserirItem(
  tenant: TenantRecord,
  chave: string,
  mesa: number,
  item: PedidoItemInput,
  obsExtra?: string,
): Promise<void> {
  const emp = sqlEmp(tenant.empresa);
  const cod = sqlMesa(mesa);
  // PRODUTO = PRODUTOS.CODIGO (nunca nome/descricao). Nome na tela vem do JOIN no GO.
  const produtoSql = sqlProdutoCodigo(String(item.produto));
  const barra = escapeSqlString(item.barra ?? String(item.produto));
  const un = "UN";
  const qtd = Number(item.qtd);
  const preco = Number(item.preco);
  const total = Math.round(qtd * preco * 100) / 100;
  const desc = 0;
  const obsParts = [item.obs, obsExtra].filter(Boolean);
  const obs = escapeSqlString(obsParts.join(" | ").slice(0, 200));
  

  // aqui faz update ou insert de acordo com o pedid
  const sql = `
      UPDATE OR INSERT INTO MESASITENS(
         EMPRESA,CODIGO,ITEM,STATUS,HORA,PRODUTO,BARRA,
         QUANTIDADE,UNIDADE,PRECO,TOTAL,ACRESCIMO,DESCONTO,VALOR,OBS
      ) VALUES(
        ${emp},${cod},(SELECT COALESCE(MAX(ITEM),0)+1 FROM MESASITENS WHERE EMPRESA=${emp} AND CODIGO=${cod} AND VALOR <> 0.00),
        'N',(CURRENT_TIME),${produtoSql},'${barra}',
        ${qtd},'${un}',${preco},${total},0,${desc},${total},'${obs}'
      )
      `.trim();

    await executaSQLApp(tenant.cnpj, chave, sql);
  }

async function atualizarTotaisMesa(
  tenant: TenantRecord,
  chave: string,
  mesa: number,
): Promise<number> {
  const emp = sqlEmp(tenant.empresa);
  const cod = sqlMesa(mesa);

  const sumRows = await consultaSQL(
    tenant.cnpj,
        `SELECT COALESCE(SUM(VALOR),0) AS TOTAL FROM MESASITENS WHERE EMPRESA=${emp} AND CODIGO=${cod} AND VALOR <> 0.00`,
      );
  const total = sumRows.length ? cellNum(sumRows[0], "TOTAL") : 0;
  const desconto = 0;
  const acrescimo = 0;
  const valor = total - desconto + acrescimo;

  const sql = `
          UPDATE MESAS SET
            DATA=(CURRENT_DATE), HORA=(CURRENT_TIME),
            TOTAL=${total}, DESCONTO=${desconto}, ACRESCIMO=${acrescimo}, VALOR=${valor}
          WHERE EMPRESA=${emp} AND CODIGO=${cod}
          `.trim();

  await executaSQLApp(tenant.cnpj, chave, sql);
  return total;
}

/**
 * Envia pedido do cardápio digital → MESAS + MESASITENS (igual gsmarketGO).
 */

export async function enviarPedidoGsMarket(
  tenant: TenantRecord,
  mesa: number,
  itens: PedidoItemInput[],
  observacaoGeral?: string,
): Promise<EnviarPedidoResult> {
  const chave = tenant.chave?.trim();
  if (!chave) {
    throw new Error(
        "CHAVE da loja não configurada. Defina GSMARKET_CHAVE.",
    );
  }

  const abertaAntes = await mesaEstaAberta(tenant, mesa);
  if (!abertaAntes) {
    await garantirMesaAberta(tenant, chave, mesa);
  }

  // Se já aberta: só acrescenta itens (NÃO zera MESASITENS).
  let first = true;
  for (const item of itens) {
    const obsGeral = first ? observacaoGeral : undefined;
    first = false;
    await inserirItem(tenant, chave, mesa, item, obsGeral);
  }

  const total = await atualizarTotaisMesa(tenant, chave, mesa);

  return {
    mesa,
    itensInseridos: itens.length,
    total: Math.round(total * 100) / 100,
    mesaAbertaAntes: abertaAntes,
  };
}

