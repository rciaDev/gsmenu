import QRCode from "qrcode";
import { mesaExisteNoGsMarket } from "@/lib/gsmarket/mesas";
import { resolveTenantSlugFromRequest } from "@/lib/tenant";
import { getTenantBySlug } from "@/lib/tenants-server";

type Params = { params: Promise<{ codigo: string }> };

export async function GET(request: Request, { params }: Params) {
  const slug = resolveTenantSlugFromRequest(request);
  const tenant = getTenantBySlug(slug);
  if (!tenant) {
    return Response.json({ error: "Tenant inválido" }, { status: 404 });
  }

  const { codigo: raw } = await params;
  const codigo = Number(raw);
  if (!Number.isInteger(codigo) || codigo < 1) {
    return Response.json({ error: "Mesa inválida" }, { status: 400 });
  }

  const existe = await mesaExisteNoGsMarket(tenant, codigo);
  if (!existe) {
    return Response.json({ error: "Mesa não encontrada no GSMarket" }, { status: 404 });
  }

  const reqHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (reqHost?.includes("localhost") ? "http" : "https");

  const url = process.env.GSMENU_PUBLIC_HOST
    ? `${process.env.GSMENU_PUBLIC_PROTOCOL ?? "https"}://${process.env.GSMENU_PUBLIC_HOST}/m/${codigo}`
    : reqHost
      ? `${proto}://${reqHost}/m/${codigo}`
      : `https://${tenant.slug}.gsmarket.com.br/m/${codigo}`;

  const png = await QRCode.toBuffer(url, {
    type: "png",
    width: 512,
    margin: 2,
    errorCorrectionLevel: "M",
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="mesa-${codigo}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
