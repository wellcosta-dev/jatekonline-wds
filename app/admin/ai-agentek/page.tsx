"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Package,
  FileText,
  Share2,
  CheckCircle,
  Clock,
  Zap,
  Activity,
  Terminal,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiAgent, AiAgentActivity } from "@/lib/server/ai-agents";

const agentVisuals: Record<string, { icon: React.ElementType; color: string; textColor: string }> = {
  "order-processor": {
    icon: ShoppingCart,
    color: "from-primary to-primary-light",
    textColor: "text-primary",
  },
  "product-description": {
    icon: Package,
    color: "from-brand-cyan to-cyan-400",
    textColor: "text-brand-cyan",
  },
  "blog-generator": {
    icon: FileText,
    color: "from-brand-pink to-pink-400",
    textColor: "text-brand-pink",
  },
  "social-media": {
    icon: Share2,
    color: "from-accent to-amber-400",
    textColor: "text-accent",
  },
};

export default function AdminAiAgentekPage() {
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [globalActivity, setGlobalActivity] = useState<AiAgentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  useEffect(() => {
    async function loadAgents() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/admin/ai-agents", { cache: "no-store" });
        const payload = (await response.json()) as {
          agents?: AiAgent[];
          activity?: AiAgentActivity[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error ?? "Nem sikerült betölteni az AI agenteket.");
        }
        setAgents(payload.agents ?? []);
        setGlobalActivity(payload.activity ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Betöltési hiba.");
      } finally {
        setLoading(false);
      }
    }
    loadAgents();
  }, []);

  const activeAgents = useMemo(
    () => agents.filter((agent) => agent.status === "active").length,
    [agents]
  );
  const successfulTasks = useMemo(
    () => globalActivity.filter((entry) => entry.success).length,
    [globalActivity]
  );
  const successRate = globalActivity.length
    ? `${Math.round((successfulTasks / globalActivity.length) * 100)}%`
    : "-";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-dark tracking-tight">AI Agent Vezérlőpult</h1>
          <p className="text-sm text-neutral-medium">Agentek kezelése és monitorozása</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-neutral-medium text-[10px] font-bold">
            <span className="size-2 rounded-full bg-gray-400" />
            {activeAgents}/{agents.length} aktív
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 flex items-center gap-2 text-sm text-neutral-medium">
          <Loader2 className="size-4 animate-spin" />
          AI agent adatok betöltése...
        </div>
      )}

      {/* KPI strip */}
      {!loading && (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Összes naplózott feladat", value: String(globalActivity.length), icon: Zap, color: "text-primary", bg: "bg-primary/10" },
          { label: "Sikerarány", value: successRate, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
          { label: "Aktív agentek", value: `${activeAgents}/${agents.length}`, icon: Activity, color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
          { label: "Utolsó frissítés", value: "valós", icon: Clock, color: "text-accent", bg: "bg-accent/10" },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
              <div className={cn("size-9 rounded-lg flex items-center justify-center", kpi.bg)}>
                <Icon className={cn("size-4", kpi.color)} />
              </div>
              <div>
                <p className="text-lg font-extrabold text-neutral-dark tracking-tight">{kpi.value}</p>
                <p className="text-[10px] text-neutral-medium">{kpi.label}</p>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Agent cards */}
      {!loading && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {agents.length === 0 && (
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-neutral-medium">
            Nincs konfigurált AI agent.
          </div>
        )}
        {agents.map((agent) => {
          const visuals = agentVisuals[agent.id] ?? {
            icon: Terminal,
            color: "from-neutral-500 to-neutral-400",
            textColor: "text-neutral-medium",
          };
          const Icon = visuals.icon;
          const isExpanded = expandedAgent === agent.id;
          const agentTasks = globalActivity
            .filter((entry) => entry.agentId === agent.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 8);
          return (
            <div key={agent.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
              <div className="p-5">
                <div className="flex items-start gap-3.5">
                  <div className={cn("size-11 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0", visuals.color)}>
                    <Icon className="size-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-neutral-dark tracking-tight">{agent.name}</h3>
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          agent.status === "active"
                            ? "bg-emerald-500"
                            : agent.status === "paused"
                              ? "bg-amber-500"
                              : "bg-gray-400"
                        )}
                      />
                    </div>
                    <p className="text-[10px] text-neutral-medium mt-0.5">{agent.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mt-4">
                  <div className="p-3 bg-gray-50/80 rounded-xl">
                    <p className="text-[10px] text-neutral-medium">{agent.metric1Label}</p>
                    <p className="text-lg font-extrabold text-neutral-dark tracking-tight mt-0.5">{agent.metric1Value}</p>
                  </div>
                  <div className="p-3 bg-gray-50/80 rounded-xl">
                    <p className="text-[10px] text-neutral-medium">{agent.metric2Label}</p>
                    <p className="text-lg font-extrabold text-neutral-dark tracking-tight mt-0.5">{agent.metric2Value}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-neutral-medium bg-gray-100 rounded-xl">
                    Állapot: {agent.status === "active" ? "Aktív" : agent.status === "paused" ? "Szünet" : "Inaktív"}
                  </span>
                  <button
                    onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                    className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                  >
                    <Terminal className="size-3" />
                    Napló
                    {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-3 p-3 bg-neutral-dark rounded-xl">
                    <div className="space-y-1.5">
                      {agentTasks.length === 0 && (
                        <p className="text-[10px] text-gray-400">Ehhez az agenthez még nincs naplózott esemény.</p>
                      )}
                      {agentTasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2 text-[10px]">
                          <span className="font-mono text-gray-500 w-16">
                            {new Date(task.createdAt).toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className={cn("size-1.5 rounded-full flex-shrink-0", task.success ? "bg-emerald-400" : "bg-red-400")} />
                          <span className="text-gray-300">{task.action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Global activity timeline */}
      {!loading && (
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-neutral-dark tracking-tight">Tevékenység idővonal</h2>
          <p className="text-[10px] text-neutral-medium mt-0.5">Utolsó 8 művelet</p>
        </div>
        <div className="divide-y divide-gray-50">
          {globalActivity.length === 0 && (
            <div className="px-5 py-8 text-sm text-neutral-medium">
              Még nincs naplózott agent tevékenység.
            </div>
          )}
          {globalActivity
            .slice()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 8)
            .map((log) => {
            const agent = agents.find((entry) => entry.id === log.agentId);
            const visuals = agentVisuals[log.agentId] ?? {
              icon: Terminal,
              color: "from-neutral-500 to-neutral-400",
              textColor: "text-neutral-medium",
            };
            const LogIcon = visuals.icon;
            return (
              <div key={log.id} className="flex items-center gap-3.5 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className={cn("size-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0")}>
                  <LogIcon className={cn("size-3.5", visuals.textColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-neutral-dark">{agent?.name ?? log.agentId}</span>
                    <span className="text-[10px] text-neutral-medium">{log.action}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-neutral-medium">
                  {new Date(log.createdAt).toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className={cn("size-2 rounded-full flex-shrink-0", log.success ? "bg-emerald-500" : "bg-red-500")} />
              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
}
