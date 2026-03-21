import { NextRequest, NextResponse } from "next/server";
import { buildPluginFromInput, getPlugins, savePlugins } from "@/lib/server/plugins";
import { requireAdmin } from "@/lib/server/api-auth";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
    const { id } = await params;
    const body = await request.json();

    const plugins = await getPlugins();
    const index = plugins.findIndex((plugin) => plugin.id === id);
    if (index < 0) {
      return NextResponse.json({ error: "Plugin nem található." }, { status: 404 });
    }

    const updated = buildPluginFromInput({
      ...plugins[index],
      ...body,
      id: plugins[index].id,
      createdAt: plugins[index].createdAt,
    });

    const next = [...plugins];
    next[index] = updated;
    await savePlugins(next);

    return NextResponse.json({ plugin: updated });
  } catch (error) {
    console.error("PUT /api/admin/plugins/[id] error:", error);
    return NextResponse.json({ error: "Nem sikerült frissíteni a plugint." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const unauthorized = requireAdmin(_request);
    if (unauthorized) return unauthorized;
    const { id } = await params;
    const plugins = await getPlugins();
    const exists = plugins.some((plugin) => plugin.id === id);
    if (!exists) {
      return NextResponse.json({ error: "Plugin nem található." }, { status: 404 });
    }

    const next = plugins.filter((plugin) => plugin.id !== id);
    await savePlugins(next);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/plugins/[id] error:", error);
    return NextResponse.json({ error: "Nem sikerült törölni a plugint." }, { status: 500 });
  }
}
