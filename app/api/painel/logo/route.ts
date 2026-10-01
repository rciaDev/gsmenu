import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { publicTenantView, upsertTenantConfig } from "@/lib/painel/store";
import { resolveTenantSlugFromRequest } from "@/lib/tenant";
import { getTenantBySlug } from "@/lib/tenants-server";

export async function POST(request: Request) {
  const slug = resolveTenantSlugFromRequest(request);
  if (!getTenantBySlug(slug)) {
    return Response.json({ error: "Tenant inválido" }, { status: 404 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Envie um arquivo" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "Arquivo precisa ser imagem" }, { status: 400 });
  }
  if (file.size > 2_000_000) {
    return Response.json({ error: "Imagem no máximo 2 MB" }, { status: 400 });
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const dir = path.join(process.cwd(), "public", "uploads", slug);
  mkdirSync(dir, { recursive: true });
  const filename = `logo.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(path.join(dir, filename), buffer);

  const logoUrl = `/uploads/${slug}/${filename}?v=${Date.now()}`;
  const tenant = upsertTenantConfig(slug, { logoUrl });
  return Response.json(publicTenantView(tenant));
}
