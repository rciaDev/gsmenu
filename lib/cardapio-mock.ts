import type { CardapioResponse, Categoria } from "./types";
import { DEFAULT_TENANT_SLUG, getStaticTenantBySlug, TENANTS } from "./tenants";

/** Cardápio mock — categorias fixas do GSMenu */
const CARDAPIO_POR_TENANT: Record<string, Categoria[]> = {
  senzala: [
    {
      id: "lanches",
      nome: "lanches",
      produtos: [
        {
          produto: "000101",
          barra: "789101",
          nome: "Smash Duplo",
          ingredientes:
            "O Smash Duplo é uma explosão de sabor com 2 blends 90g smashados na chapa, queijo cheddar derretido, cebola crispy e o molho especial da casa no pão macio.",
          preco: 34.9,
          fotoUrl:
            "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80",
          destaque: true,
          tempoPreparoMin: 15,
          tempoPreparoMax: 20,
        },
        {
          produto: "000102",
          barra: "789102",
          nome: "Burger Completo",
          ingredientes:
            "Blend 160g, bacon crocante, ovo, queijo, alface e tomate frescos. Servido no pão brioche levemente tostado.",
          preco: 39.9,
          fotoUrl:
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
          destaque: true,
          tempoPreparoMin: 18,
          tempoPreparoMax: 25,
        },
        {
          produto: "000201",
          barra: "789201",
          nome: "Clássico",
          ingredientes: "Blend 120g, queijo, alface, tomate e maionese da casa.",
          preco: 28.9,
          fotoUrl:
            "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&q=80",
          tempoPreparoMin: 12,
          tempoPreparoMax: 18,
        },
      ],
    },
    {
      id: "pizza",
      nome: "pizza",
      produtos: [
        {
          produto: "000501",
          barra: "789501",
          nome: "Mussarela",
          ingredientes: "Molho de tomate, mussarela e orégano.",
          preco: 49.9,
          fotoUrl:
            "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&q=80",
          tempoPreparoMin: 20,
          tempoPreparoMax: 30,
        },
      ],
    },
    {
      id: "porcoes",
      nome: "porções",
      produtos: [
        {
          produto: "000301",
          barra: "789301",
          nome: "Batata rústica",
          ingredientes: "Porção 400g com páprica e alecrim.",
          preco: 18.9,
          fotoUrl:
            "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&q=80",
          tempoPreparoMin: 10,
          tempoPreparoMax: 15,
        },
        {
          produto: "000302",
          barra: "789302",
          nome: "Onion rings",
          ingredientes: "Anéis crocantes com molho especial.",
          preco: 16.9,
          fotoUrl: null,
          tempoPreparoMin: 8,
          tempoPreparoMax: 12,
        },
      ],
    },
    {
      id: "agua",
      nome: "água",
      produtos: [
        {
          produto: "000601",
          barra: "789601",
          nome: "Água mineral 500ml",
          ingredientes: null,
          preco: 4.5,
          fotoUrl: null,
        },
      ],
    },
    {
      id: "refri",
      nome: "refri",
      produtos: [
        {
          produto: "000401",
          barra: "789401",
          nome: "Refrigerante lata",
          ingredientes: null,
          preco: 6.5,
          fotoUrl: null,
        },
        {
          produto: "000402",
          barra: "789402",
          nome: "Suco natural 500ml",
          ingredientes: "Laranja, limão ou abacaxi.",
          preco: 12.0,
          fotoUrl: null,
          tempoPreparoMin: 5,
          tempoPreparoMax: 8,
        },
      ],
    },
    {
      id: "cerveja",
      nome: "cerveja",
      produtos: [
        {
          produto: "000701",
          barra: "789701",
          nome: "Cerveja long neck",
          ingredientes: null,
          preco: 12.0,
          fotoUrl: null,
        },
      ],
    },
    {
      id: "whisky",
      nome: "whisky",
      produtos: [
        {
          produto: "000801",
          barra: "789801",
          nome: "Whisky dose",
          ingredientes: null,
          preco: 28.0,
          fotoUrl: null,
        },
      ],
    },
  ],
  demo: [
    {
      id: "lanches",
      nome: "lanches",
      produtos: [
        {
          produto: "1001",
          barra: "1001",
          nome: "Burguer Completo",
          ingredientes:
            "Pão brioche, blend artesanal, queijo e bacon. Uma explosão de sabor no primeiro mordida.",
          preco: 42.0,
          fotoUrl:
            "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&q=80",
          destaque: true,
          tempoPreparoMin: 20,
          tempoPreparoMax: 30,
        },
        {
          produto: "1002",
          barra: "1002",
          nome: "Cheese Bacon",
          ingredientes: "Blend 150g, cheddar e bacon crocante.",
          preco: 38.0,
          fotoUrl:
            "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80",
          tempoPreparoMin: 15,
          tempoPreparoMax: 22,
        },
      ],
    },
    {
      id: "refri",
      nome: "refri",
      produtos: [
        {
          produto: "1003",
          barra: "1003",
          nome: "Refrigerante lata",
          ingredientes: null,
          preco: 7.0,
          fotoUrl: null,
        },
      ],
    },
  ],
};

export function getCardapioMock(slug: string): CardapioResponse | null {
  const tenant =
    getStaticTenantBySlug(slug) ??
    getStaticTenantBySlug(DEFAULT_TENANT_SLUG) ??
    TENANTS[DEFAULT_TENANT_SLUG];
  if (!tenant) return null;

  const categorias =
    CARDAPIO_POR_TENANT[slug] ?? CARDAPIO_POR_TENANT[DEFAULT_TENANT_SLUG];

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
