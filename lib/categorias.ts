/** Categorias fixas do cardápio digital (ordem de exibição). */
export const CATEGORIAS_FIXAS = [
  { id: "lanches", nome: "lanches" },
  { id: "pizza", nome: "pizza" },
  { id: "agua", nome: "água" },
  { id: "refri", nome: "refri" },
  { id: "cerveja", nome: "cerveja" },
  { id: "whisky", nome: "whisky" },
  { id: "porcoes", nome: "porções" },
] as const;

export type CategoriaFixaId = (typeof CATEGORIAS_FIXAS)[number]["id"];
export type CategoriaFixa = (typeof CATEGORIAS_FIXAS)[number];

function normalize(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function includesAny(n: string, words: string[]): boolean {
  return words.some((w) => n.includes(w));
}

/**
 * Mapeia nome/código de categoria (ou nome do produto) para um bucket fixo.
 */
export function matchCategoriaFixa(
  nomeOuCodigo: string | null | undefined,
): CategoriaFixa | null {
  if (!nomeOuCodigo) return null;
  const n = normalize(nomeOuCodigo);
  if (!n) return null;

  // Ordem importa: bebidas alcoólicas antes de "bebida" genérico.
  if (
    includesAny(n, [
      "whisky",
      "whiskey",
      "vodka",
      "gin",
      "rum",
      "tequila",
      "destilado",
      "licor",
      "drink",
      "dose",
    ])
  ) {
    return CATEGORIAS_FIXAS[5];
  }
  if (
    includesAny(n, [
      "cerveja",
      "chopp",
      "chope",
      "beer",
      "heineken",
      "brahma",
      "skol",
      "antarctica",
      "budweiser",
      "corona",
      "stella",
    ])
  ) {
    return CATEGORIAS_FIXAS[4];
  }
  if (
    includesAny(n, ["agua", "aguas", "mineral", "crystal", "sao lourenco", "lindoya"])
  ) {
    return CATEGORIAS_FIXAS[2];
  }
  if (
    includesAny(n, [
      "refri",
      "refrigerante",
      "soda",
      "suco",
      "coca",
      "guarana",
      "fanta",
      "sprite",
      "pepsi",
      "schweppes",
      "tonica",
      "energetico",
      "red bull",
      "h2o",
    ])
  ) {
    return CATEGORIAS_FIXAS[3];
  }
  if (includesAny(n, ["pizza", "pizzas"])) {
    return CATEGORIAS_FIXAS[1];
  }
  if (
    includesAny(n, [
      "lanche",
      "lanches",
      "burger",
      "burguer",
      "hambur",
      "sanduiche",
      "sanduba",
      "hot dog",
      "hotdog",
      "dogao",
      "xis",
      "smash",
      "wrap",
      "beirute",
    ])
  ) {
    return CATEGORIAS_FIXAS[0];
  }
  if (
    includesAny(n, [
      "porcao",
      "porcoes",
      "acompanhamento",
      "petisco",
      "entrada",
      "batata",
      "fritas",
      "onion",
      "anel",
      "calabresa",
      "passarinho",
      "mandioca",
      "polenta",
      "nugget",
      "pastel",
      "coxinha",
      "bolinho",
    ])
  ) {
    return CATEGORIAS_FIXAS[6];
  }

  // Categorias genéricas do ERP
  if (includesAny(n, ["bebida", "bebidas", "drink"])) {
    return CATEGORIAS_FIXAS[3]; // refri como fallback de bebida
  }
  if (includesAny(n, ["comida", "prato", "refeicao", "salgado"])) {
    return CATEGORIAS_FIXAS[0];
  }

  return null;
}

/** Tenta categoria do ERP, depois nome do produto. */
export function resolveCategoriaFixa(input: {
  catNome?: string | null;
  catCodigo?: string | null;
  produtoNome?: string | null;
}): CategoriaFixa | null {
  return (
    matchCategoriaFixa(input.catNome) ??
    matchCategoriaFixa(input.catCodigo) ??
    matchCategoriaFixa(input.produtoNome)
  );
}
