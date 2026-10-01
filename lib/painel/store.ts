import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type PainelUser = {
  id: string;
  email: string;
  nome: string;
  slug: string;
  passwordHash: string;
  createdAt: string;
};

export type TenantPainelConfig = {
  slug: string;
  nome: string;
  cidade: string;
  cor: string;
  logoUrl: string | null;
  heroUrl: string | null;
  cnpj: string;
  empresa: number;
  /** Não expor ao client nas APIs públicas */
  chave?: string | null;
  mesas: number[];
  updatedAt: string;
};

export type PedidoLog = {
  id: string;
  slug: string;
  mesa: number;
  total: number;
  itens: number;
  status: string;
  mock: boolean;
  createdAt: string;
  observacaoGeral?: string;
};

export type SessionRecord = {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

type StoreData = {
  users: PainelUser[];
  tenants: Record<string, TenantPainelConfig>;
  sessions: SessionRecord[];
  pedidos: PedidoLog[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "painel-store.json");

/** Cache em memória — obrigatório na Vercel (filesystem read-only). */
let memoryStore: StoreData | null = null;
let persistDisabled = false;

function emptyStore(): StoreData {
  return { users: [], tenants: {}, sessions: [], pedidos: [] };
}

function seedStore(): StoreData {
  const seed = emptyStore();
  seed.tenants.senzala = {
    slug: "senzala",
    nome: "Senzala Burger",
    cidade: "Mogi das Cruzes - SP",
    cor: "#C45C26",
    logoUrl: null,
    heroUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=80",
    cnpj: process.env.GSMARKET_CNPJ_SENZALA ?? "12345678000199",
    empresa: Number(process.env.GSMARKET_EMPRESA_SENZALA ?? "1") || 1,
    chave:
      process.env.GSMARKET_CHAVE_SENZALA ?? process.env.GSMARKET_CHAVE ?? null,
    mesas: Array.from({ length: 20 }, (_, i) => i + 1),
    updatedAt: new Date().toISOString(),
  };
  seed.users.push({
    id: randomBytes(8).toString("hex"),
    email: "admin@senzala.com",
    nome: "Admin Senzala",
    slug: "senzala",
    passwordHash: hashPassword("senzala123"),
    createdAt: new Date().toISOString(),
  });
  return seed;
}

function tryReadDisk(): StoreData | null {
  try {
    if (!existsSync(STORE_PATH)) return null;
    return JSON.parse(readFileSync(STORE_PATH, "utf8")) as StoreData;
  } catch {
    return null;
  }
}

function tryWriteDisk(data: StoreData): boolean {
  if (persistDisabled) return false;
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch {
    persistDisabled = true;
    return false;
  }
}

function ensureStore(): StoreData {
  if (memoryStore) return memoryStore;

  const fromDisk = tryReadDisk();
  if (fromDisk) {
    memoryStore = fromDisk;
    return memoryStore;
  }

  const seed = seedStore();
  tryWriteDisk(seed);
  memoryStore = seed;
  return memoryStore;
}

function saveStore(data: StoreData) {
  memoryStore = data;
  tryWriteDisk(data);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 64);
  const prev = Buffer.from(hash, "hex");
  if (prev.length !== next.length) return false;
  return timingSafeEqual(prev, next);
}

export function readStore(): StoreData {
  return ensureStore();
}

export function withStore<T>(fn: (data: StoreData) => T): T {
  const data = ensureStore();
  const result = fn(data);
  saveStore(data);
  return result;
}

export function getTenantConfig(slug: string): TenantPainelConfig | null {
  const data = ensureStore();
  return data.tenants[slug] ?? null;
}

export function upsertTenantConfig(
  slug: string,
  patch: Partial<TenantPainelConfig>,
): TenantPainelConfig {
  return withStore((data) => {
    const current = data.tenants[slug] ?? {
      slug,
      nome: slug,
      cidade: "",
      cor: "#C45C26",
      logoUrl: null,
      heroUrl: null,
      cnpj: "",
      empresa: 1,
      chave: null,
      mesas: [1],
      updatedAt: new Date().toISOString(),
    };
    const next: TenantPainelConfig = {
      ...current,
      ...patch,
      slug,
      mesas: patch.mesas ?? current.mesas,
      updatedAt: new Date().toISOString(),
    };
    data.tenants[slug] = next;
    return next;
  });
}

export function findUserByEmail(email: string): PainelUser | null {
  const data = ensureStore();
  const key = email.trim().toLowerCase();
  return data.users.find((u) => u.email === key) ?? null;
}

export function createUser(input: {
  email: string;
  nome: string;
  slug: string;
  password: string;
}): PainelUser {
  return withStore((data) => {
    const email = input.email.trim().toLowerCase();
    if (data.users.some((u) => u.email === email)) {
      throw new Error("E-mail já cadastrado");
    }
    const user: PainelUser = {
      id: randomBytes(8).toString("hex"),
      email,
      nome: input.nome.trim(),
      slug: input.slug.trim().toLowerCase(),
      passwordHash: hashPassword(input.password),
      createdAt: new Date().toISOString(),
    };
    data.users.push(user);
    if (!data.tenants[user.slug]) {
      data.tenants[user.slug] = {
        slug: user.slug,
        nome: input.nome.trim() || user.slug,
        cidade: "",
        cor: "#C45C26",
        logoUrl: null,
        heroUrl: null,
        cnpj: "",
        empresa: 1,
        chave: null,
        mesas: Array.from({ length: 12 }, (_, i) => i + 1),
        updatedAt: new Date().toISOString(),
      };
    }
    return user;
  });
}

export function createSession(userId: string): SessionRecord {
  const token = createHash("sha256")
    .update(randomBytes(32))
    .digest("hex");
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 1000 * 60 * 60 * 24 * 14);
  return withStore((data) => {
    data.sessions = data.sessions.filter(
      (s) => s.userId !== userId && new Date(s.expiresAt) > new Date(),
    );
    const session: SessionRecord = {
      token,
      userId,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    data.sessions.push(session);
    return session;
  });
}

export function getSessionUser(token: string | undefined | null): {
  user: PainelUser;
  tenant: TenantPainelConfig;
} | null {
  if (!token) return null;
  const data = ensureStore();
  const session = data.sessions.find((s) => s.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt) <= new Date()) {
    withStore((d) => {
      d.sessions = d.sessions.filter((s) => s.token !== token);
    });
    return null;
  }
  const user = data.users.find((u) => u.id === session.userId);
  if (!user) return null;
  let tenant = data.tenants[user.slug];
  if (!tenant) {
    tenant = upsertTenantConfig(user.slug, { nome: user.nome });
  }
  return { user, tenant };
}

export function destroySession(token: string | undefined | null) {
  if (!token) return;
  withStore((data) => {
    data.sessions = data.sessions.filter((s) => s.token !== token);
  });
}

export function addMesas(slug: string, quantidade: number): TenantPainelConfig {
  return withStore((data) => {
    const tenant = data.tenants[slug];
    if (!tenant) throw new Error("Estabelecimento não encontrado");
    const qtd = Math.min(50, Math.max(1, Math.floor(quantidade) || 1));
    const max = tenant.mesas.length ? Math.max(...tenant.mesas) : 0;
    for (let i = 1; i <= qtd; i++) tenant.mesas.push(max + i);
    tenant.updatedAt = new Date().toISOString();
    return tenant;
  });
}

export function removeMesa(slug: string, codigo: number): TenantPainelConfig {
  return withStore((data) => {
    const tenant = data.tenants[slug];
    if (!tenant) throw new Error("Estabelecimento não encontrado");
    tenant.mesas = tenant.mesas.filter((m) => m !== codigo);
    tenant.updatedAt = new Date().toISOString();
    return tenant;
  });
}

export function appendPedidoLog(log: Omit<PedidoLog, "id" | "createdAt">) {
  return withStore((data) => {
    const entry: PedidoLog = {
      ...log,
      id: randomBytes(6).toString("hex"),
      createdAt: new Date().toISOString(),
    };
    data.pedidos.unshift(entry);
    data.pedidos = data.pedidos.slice(0, 200);
    return entry;
  });
}

export function listPedidos(slug: string, limit = 50): PedidoLog[] {
  const data = ensureStore();
  return data.pedidos.filter((p) => p.slug === slug).slice(0, limit);
}

export function publicTenantView(tenant: TenantPainelConfig) {
  return {
    slug: tenant.slug,
    nome: tenant.nome,
    cidade: tenant.cidade,
    cor: tenant.cor,
    logoUrl: tenant.logoUrl,
    heroUrl: tenant.heroUrl,
    cnpj: tenant.cnpj,
    empresa: tenant.empresa,
    qtdMesas: tenant.mesas.length,
    mesas: [...tenant.mesas].sort((a, b) => a - b),
    updatedAt: tenant.updatedAt,
  };
}
