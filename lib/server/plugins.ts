import type { AdminPlugin, PluginConfigField } from "@/types";
import { readJsonFile, writeJsonFile } from "@/lib/server/storage";
import { defaultPlugins, DEFAULT_PLUGIN_DEVELOPER } from "@/lib/plugins/defaults";

const PLUGINS_FILE = "plugins.json";

export async function getPlugins(): Promise<AdminPlugin[]> {
  const stored = await readJsonFile<AdminPlugin[]>(PLUGINS_FILE, defaultPlugins);
  return [...stored].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function savePlugins(plugins: AdminPlugin[]): Promise<void> {
  await writeJsonFile(PLUGINS_FILE, plugins);
}

export async function getPluginById(id: string): Promise<AdminPlugin | undefined> {
  const all = await getPlugins();
  return all.find((plugin) => plugin.id === id);
}

export function sanitizePluginConfig(config: unknown): PluginConfigField[] {
  if (!Array.isArray(config)) return [];
  return config
    .map((field) => {
      if (!field || typeof field !== "object") return null;
      const candidate = field as Partial<PluginConfigField>;
      if (!candidate.key || !candidate.label || !candidate.type) return null;
      return {
        key: String(candidate.key),
        label: String(candidate.label),
        value: String(candidate.value ?? ""),
        type:
          candidate.type === "secret" ||
          candidate.type === "number" ||
          candidate.type === "boolean"
            ? candidate.type
            : "text",
      } as PluginConfigField;
    })
    .filter((item): item is PluginConfigField => Boolean(item));
}

export function buildPluginFromInput(input: Partial<AdminPlugin>): AdminPlugin {
  const now = new Date().toISOString();
  return {
    id: input.id ?? `plugin-${Date.now()}`,
    name: String(input.name ?? "Új plugin"),
    slug: String(input.slug ?? `plugin-${Date.now()}`),
    description: String(input.description ?? "Nincs leírás."),
    version: String(input.version ?? "1.0.0"),
    developer: String(input.developer ?? DEFAULT_PLUGIN_DEVELOPER),
    category: String(input.category ?? "Integráció"),
    status: input.status === "active" ? "active" : "inactive",
    isInstalled: Boolean(input.isInstalled ?? true),
    config: sanitizePluginConfig(input.config),
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };
}
