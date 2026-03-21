import { NextRequest, NextResponse } from "next/server";
import { buildPluginFromInput, getPlugins, savePlugins } from "@/lib/server/plugins";
import { DEFAULT_PLUGIN_DEVELOPER } from "@/lib/plugins/defaults";
import { requireAdmin } from "@/lib/server/api-auth";

export async function GET(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
    const plugins = await getPlugins();
    return NextResponse.json({ plugins });
  } catch (error) {
    console.error("GET /api/admin/plugins error:", error);
    return NextResponse.json({ error: "Nem sikerült betölteni a pluginokat." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
    const body = await request.json();
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: "A plugin név és slug kötelező." },
        { status: 400 }
      );
    }

    const current = await getPlugins();
    const exists = current.some((plugin) => plugin.slug === body.slug);
    if (exists) {
      return NextResponse.json(
        { error: "Ez a slug már létezik." },
        { status: 409 }
      );
    }

    const plugin = buildPluginFromInput({
      name: body.name,
      slug: body.slug,
      description: body.description,
      version: body.version,
      category: body.category,
      developer: body.developer || DEFAULT_PLUGIN_DEVELOPER,
      status: body.status,
      isInstalled: true,
      config: body.config,
    });

    await savePlugins([plugin, ...current]);
    return NextResponse.json({ plugin }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/plugins error:", error);
    return NextResponse.json({ error: "Nem sikerült létrehozni a plugint." }, { status: 500 });
  }
}
