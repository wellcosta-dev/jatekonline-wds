"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Puzzle,
  Plus,
  Search,
  Power,
  Settings2,
  Trash2,
  User,
  Save,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminPlugin, PluginConfigField } from "@/types";
import { DEFAULT_PLUGIN_DEVELOPER } from "@/lib/plugins/defaults";
import { StatusChip } from "@/app/admin/_components/StatusChip";

export default function AdminPluginokPage() {
  const [plugins, setPlugins] = useState<AdminPlugin[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    version: "1.0.0",
    category: "Integráció",
    developer: DEFAULT_PLUGIN_DEVELOPER,
  });

  useEffect(() => {
    void fetchPlugins();
  }, []);

  async function fetchPlugins() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/plugins", { cache: "no-store" });
      if (!response.ok) throw new Error("Nem sikerült betölteni a pluginokat.");
      const data = (await response.json()) as { plugins: AdminPlugin[] };
      setPlugins(data.plugins ?? []);
      if (!selectedId && data.plugins?.[0]) {
        setSelectedId(data.plugins[0].id);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Betöltési hiba.");
    } finally {
      setLoading(false);
    }
  }

  async function createPlugin() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/plugins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          status: "inactive",
          config: [],
        }),
      });
      const data = (await response.json()) as { plugin?: AdminPlugin; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Nem sikerült létrehozni a plugint.");
      if (data.plugin) {
        setPlugins((prev) => [data.plugin as AdminPlugin, ...prev]);
        setSelectedId(data.plugin.id);
      }
      setShowCreate(false);
      setForm({
        name: "",
        slug: "",
        description: "",
        version: "1.0.0",
        category: "Integráció",
        developer: DEFAULT_PLUGIN_DEVELOPER,
      });
      setMessage("Plugin sikeresen létrehozva.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Létrehozási hiba.");
    } finally {
      setSaving(false);
    }
  }

  async function updatePlugin(id: string, patch: Partial<AdminPlugin>) {
    try {
      const response = await fetch(`/api/admin/plugins/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await response.json()) as { plugin?: AdminPlugin; error?: string };
      if (!response.ok || !data.plugin) {
        throw new Error(data.error ?? "Nem sikerült frissíteni a plugint.");
      }
      setPlugins((prev) => prev.map((plugin) => (plugin.id === id ? data.plugin! : plugin)));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Frissítési hiba.");
    }
  }

  async function deletePlugin(id: string) {
    if (!confirm("Biztosan törlöd a plugint?")) return;
    try {
      const response = await fetch(`/api/admin/plugins/${id}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Nem sikerült törölni a plugint.");
      setPlugins((prev) => prev.filter((plugin) => plugin.id !== id));
      setSelectedId((prev) => (prev === id ? null : prev));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Törlési hiba.");
    }
  }

  const filtered = plugins.filter((plugin) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      plugin.name.toLowerCase().includes(q) ||
      plugin.slug.toLowerCase().includes(q) ||
      plugin.category.toLowerCase().includes(q)
    );
  });

  const selected = plugins.find((plugin) => plugin.id === selectedId) ?? null;
  const activeCount = plugins.filter((plugin) => plugin.status === "active").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-dark tracking-tight">Pluginkezelő</h1>
          <p className="text-sm text-neutral-medium">
            Saját pluginok kezelése, konfigurálása és aktiválása
          </p>
        </div>
        <button
          onClick={() => setShowCreate((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary rounded-xl hover:bg-primary-dark shadow-sm shadow-primary/20 transition-colors"
        >
          <Plus className="size-3.5" />
          Új plugin
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Összes plugin" value={String(plugins.length)} icon={Puzzle} />
        <StatCard label="Aktív plugin" value={String(activeCount)} icon={Power} />
        <StatCard label="Fejlesztő" value="WELLCOSTA" icon={Sparkles} />
      </div>

      {showCreate && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <p className="text-sm font-bold text-neutral-dark tracking-tight">Új plugin létrehozása</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Név"
              value={form.name}
              onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
              placeholder="Cookie Banner"
            />
            <Input
              label="Slug"
              value={form.slug}
              onChange={(value) => setForm((prev) => ({ ...prev, slug: value }))}
              placeholder="cookie-banner"
            />
            <Input
              label="Verzió"
              value={form.version}
              onChange={(value) => setForm((prev) => ({ ...prev, version: value }))}
              placeholder="1.0.0"
            />
            <Input
              label="Kategória"
              value={form.category}
              onChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
              placeholder="Marketing"
            />
            <div className="md:col-span-2">
              <Input
                label="Leírás"
                value={form.description}
                onChange={(value) => setForm((prev) => ({ ...prev, description: value }))}
                placeholder="Plugin rövid leírása"
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Fejlesztő"
                value={form.developer}
                onChange={(value) => setForm((prev) => ({ ...prev, developer: value }))}
                placeholder={DEFAULT_PLUGIN_DEVELOPER}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={createPlugin}
              disabled={saving || !form.name.trim() || !form.slug.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-primary rounded-xl hover:bg-primary-dark disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Mentés
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-3 py-2 text-xs font-bold text-neutral-medium bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Mégse
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-medium" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Keresés plugin név/slug szerint..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="max-h-[520px] overflow-y-auto divide-y divide-gray-50">
            {loading && (
              <div className="px-4 py-4 text-xs text-neutral-medium flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin" />
                Betöltés...
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="px-4 py-8 text-center">
                <Puzzle className="size-7 text-neutral-medium/40 mx-auto mb-2" />
                <p className="text-sm font-bold text-neutral-dark">Még nincs plugin</p>
                <p className="text-xs text-neutral-medium mt-1">Első körben üres kezelő, később bővíthető.</p>
              </div>
            )}
            {filtered.map((plugin) => (
              <button
                key={plugin.id}
                onClick={() => setSelectedId(plugin.id)}
                className={cn(
                  "w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors",
                  selectedId === plugin.id && "bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold text-neutral-dark tracking-tight">{plugin.name}</p>
                  <StatusChip label={plugin.status === "active" ? "Aktív" : "Inaktív"} tone={plugin.status === "active" ? "success" : "neutral"} />
                </div>
                <p className="text-[10px] text-neutral-medium mt-1">{plugin.slug} · v{plugin.version}</p>
                <p className="text-[10px] text-neutral-medium mt-0.5 flex items-center gap-1">
                  <User className="size-3" />
                  {plugin.developer}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          {!selected && (
            <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center">
              <Settings2 className="size-8 text-neutral-medium/40 mb-2" />
              <p className="text-sm font-bold text-neutral-dark">Válassz egy plugint</p>
              <p className="text-xs text-neutral-medium mt-1">
                Itt tudod majd a plugin konfigurációt és állapotot kezelni.
              </p>
            </div>
          )}

          {selected && (
            <PluginDetails
              plugin={selected}
              onToggle={() =>
                updatePlugin(selected.id, {
                  status: selected.status === "active" ? "inactive" : "active",
                })
              }
              onSaveConfig={(config) => updatePlugin(selected.id, { config })}
              onDelete={() => deletePlugin(selected.id)}
            />
          )}
        </div>
      </div>

      {message && (
        <p className={cn("text-xs font-medium", message.includes("siker") ? "text-emerald-600" : "text-red-600")}>
          {message}
        </p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
      <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="size-4 text-primary" />
      </div>
      <div>
        <p className="text-lg font-extrabold text-neutral-dark tracking-tight">{value}</p>
        <p className="text-[10px] text-neutral-medium">{label}</p>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold text-neutral-medium uppercase tracking-wider">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function PluginDetails({
  plugin,
  onToggle,
  onSaveConfig,
  onDelete,
}: {
  plugin: AdminPlugin;
  onToggle: () => void;
  onSaveConfig: (config: PluginConfigField[]) => void;
  onDelete: () => void;
}) {
  const [config, setConfig] = useState<PluginConfigField[]>(plugin.config ?? []);

  useEffect(() => {
    setConfig(plugin.config ?? []);
  }, [plugin.id, plugin.config]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-sm font-extrabold text-neutral-dark tracking-tight">{plugin.name}</p>
          <p className="text-xs text-neutral-medium mt-0.5">{plugin.description}</p>
          <p className="text-[10px] text-neutral-medium mt-1">
            {plugin.slug} · v{plugin.version} · {plugin.category}
          </p>
          <p className="text-[10px] text-neutral-medium mt-0.5">Fejlesztő: {plugin.developer}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggle}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-colors",
              plugin.status === "active"
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            <Power className="size-3.5" />
            {plugin.status === "active" ? "Kikapcsolás" : "Bekapcsolás"}
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100"
          >
            <Trash2 className="size-3.5" />
            Törlés
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-neutral-dark">Konfiguráció</p>
          <button
            onClick={() =>
              setConfig((prev) => [
                ...prev,
                { key: "", label: "", value: "", type: "text" },
              ])
            }
            className="text-[10px] font-bold text-primary hover:underline"
          >
            + mező hozzáadása
          </button>
        </div>

        {config.length === 0 && (
          <p className="text-xs text-neutral-medium">
            Ehhez a pluginhoz még nincs konfigurációs mező.
          </p>
        )}

        <div className="space-y-2">
          {config.map((field, index) => (
            <div key={`${field.key}-${index}`} className="grid grid-cols-1 md:grid-cols-12 gap-2">
              <input
                value={field.key}
                onChange={(event) =>
                  setConfig((prev) =>
                    prev.map((item, i) => (i === index ? { ...item, key: event.target.value } : item))
                  )
                }
                placeholder="key"
                className="md:col-span-2 px-2.5 py-2 text-xs rounded-lg border border-gray-200"
              />
              <input
                value={field.label}
                onChange={(event) =>
                  setConfig((prev) =>
                    prev.map((item, i) => (i === index ? { ...item, label: event.target.value } : item))
                  )
                }
                placeholder="Label"
                className="md:col-span-3 px-2.5 py-2 text-xs rounded-lg border border-gray-200"
              />
              <input
                value={field.value}
                onChange={(event) =>
                  setConfig((prev) =>
                    prev.map((item, i) => (i === index ? { ...item, value: event.target.value } : item))
                  )
                }
                placeholder="Érték"
                className="md:col-span-4 px-2.5 py-2 text-xs rounded-lg border border-gray-200"
              />
              <select
                value={field.type}
                onChange={(event) =>
                  setConfig((prev) =>
                    prev.map((item, i) =>
                      i === index ? { ...item, type: event.target.value as PluginConfigField["type"] } : item
                    )
                  )
                }
                className="md:col-span-2 px-2.5 py-2 text-xs rounded-lg border border-gray-200"
              >
                <option value="text">text</option>
                <option value="secret">secret</option>
                <option value="number">number</option>
                <option value="boolean">boolean</option>
              </select>
              <button
                onClick={() => setConfig((prev) => prev.filter((_, i) => i !== index))}
                className="md:col-span-1 px-2 py-2 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <button
            onClick={() => onSaveConfig(config)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-primary rounded-xl hover:bg-primary-dark"
          >
            <Save className="size-3.5" />
            Konfiguráció mentése
          </button>
        </div>
      </div>
    </div>
  );
}
