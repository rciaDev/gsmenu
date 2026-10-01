export type TenantConfig = {
  slug: string;
  nome: string;
  cnpj: string;
  empresa: number;
  logoUrl: string | null;
  heroUrl: string | null;
  cor: string;
  cidade: string;
  qtdMesas: number;
};

export type Produto = {
  /** PRODUTOS.CODIGO — vai para MESASITENS.PRODUTO (JOIN no GO) */
  produto: string;
  /** PRODUTOSBARRA.BARRA */
  barra: string;
  nome: string;
  ingredientes: string | null;
  preco: number;
  fotoUrl: string | null;
  destaque?: boolean;
  /** Tempo de preparo em minutos */
  tempoPreparoMin?: number | null;
  tempoPreparoMax?: number | null;
  /** false = oculto no cardápio público (extra GSMenu) */
  visivelNoSite?: boolean;
};

/** Grupo do cardápio (mapeado às categorias fixas do GSMenu) */
export type Categoria = {
  id?: string;
  nome: string;
  produtos: Produto[];
};

export type CardapioResponse = {
  estabelecimento: {
    nome: string;
    logoUrl: string | null;
    heroUrl: string | null;
    cor: string;
    cidade: string;
  };
  categorias: Categoria[];
};

export type PedidoItemInput = {
  produto: string;
  barra?: string;
  descricao?: string;
  qtd: number;
  preco: number;
  obs?: string;
};

export type PedidoInput = {
  tenant: string;
  mesa: number;
  observacaoGeral?: string;
  itens: PedidoItemInput[];
};

export type PedidoResponse = {
  ok: true;
  mesa: number;
  itensInseridos: number;
  total: number;
  mock: boolean;
};
