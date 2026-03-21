import { readJsonFile, writeJsonFile } from "@/lib/server/storage";

export type AiAgentStatus = "active" | "inactive" | "paused";

export interface AiAgent {
  id: string;
  name: string;
  description: string;
  status: AiAgentStatus;
  metric1Label: string;
  metric1Value: string;
  metric2Label: string;
  metric2Value: string;
  updatedAt: string;
}

export interface AiAgentActivity {
  id: string;
  agentId: string;
  action: string;
  success: boolean;
  createdAt: string;
}

interface StoredAiAgentsState {
  agents: AiAgent[];
  activity: AiAgentActivity[];
}

const AI_AGENTS_FILE = "ai-agents.json";

const DEFAULT_AI_AGENTS: AiAgent[] = [
  {
    id: "order-processor",
    name: "Rendelésfeldolgozó",
    description: "Automatikus rendelésfeldolgozás és státuszfrissítés",
    status: "inactive",
    metric1Label: "Mai feldolgozások",
    metric1Value: "0",
    metric2Label: "Sikerarány",
    metric2Value: "-",
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "product-description",
    name: "Termékleírás AI",
    description: "AI által generált termékleírások és SEO szövegek",
    status: "inactive",
    metric1Label: "Leírt termékek",
    metric1Value: "0",
    metric2Label: "Mai feladatok",
    metric2Value: "0",
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "blog-generator",
    name: "Blog generáló",
    description: "Automatikus blog cikk generálás és közzététel",
    status: "inactive",
    metric1Label: "Cikkek e hónapban",
    metric1Value: "0",
    metric2Label: "Következő futás",
    metric2Value: "-",
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "social-media",
    name: "Social Media",
    description: "Posztok generálása és ütemezése (Facebook, Instagram)",
    status: "inactive",
    metric1Label: "Posztok ezen a héten",
    metric1Value: "0",
    metric2Label: "Következő poszt",
    metric2Value: "-",
    updatedAt: new Date(0).toISOString(),
  },
];

export async function getAiAgentsState(): Promise<StoredAiAgentsState> {
  const fallback: StoredAiAgentsState = {
    agents: DEFAULT_AI_AGENTS,
    activity: [],
  };
  const stored = await readJsonFile<StoredAiAgentsState>(AI_AGENTS_FILE, fallback);

  // Ensure missing defaults are restored
  const byId = new Map(stored.agents.map((agent) => [agent.id, agent]));
  for (const item of DEFAULT_AI_AGENTS) {
    if (!byId.has(item.id)) {
      byId.set(item.id, item);
    }
  }

  return {
    agents: Array.from(byId.values()),
    activity: Array.isArray(stored.activity) ? stored.activity : [],
  };
}

export async function saveAiAgentsState(state: StoredAiAgentsState): Promise<void> {
  await writeJsonFile(AI_AGENTS_FILE, state);
}
