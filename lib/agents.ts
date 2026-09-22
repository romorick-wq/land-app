export type LandAgent = {
  id: string;
  name: string;
  role: "admin" | "agent";
};

export const AGENT_STORAGE_KEY = "land-agents-v1";

export const ADMIN_AGENT: LandAgent = {
  id: "rick-romo",
  name: "Rick Romo",
  role: "admin",
};

export const ADMIN_LABEL = "LandAgent Rick Romo";

export function agentInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "LA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function slug(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
  return base || "agent";
}

export function sanitizeAgents(value: unknown): LandAgent[] {
  const incoming = Array.isArray(value) ? value : [];
  const agents: LandAgent[] = [ADMIN_AGENT];
  const seen = new Set([ADMIN_AGENT.name.toLowerCase()]);
  for (const item of incoming) {
    if (!item || typeof item !== "object") continue;
    const record = item as { id?: unknown; name?: unknown };
    if (typeof record.name !== "string") continue;
    const name = record.name.trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 80) continue;
    if (seen.has(name.toLowerCase())) continue;
    const id = typeof record.id === "string" && record.id && record.id !== ADMIN_AGENT.id ? record.id.slice(0, 64) : slug(name);
    agents.push({ id, name, role: "agent" });
    seen.add(name.toLowerCase());
  }
  return agents;
}

export function agentNameError(name: string, agents: LandAgent[]) {
  const cleaned = name.trim().replace(/\s+/g, " ");
  if (cleaned.length < 2) return "Enter the land agent's name.";
  if (cleaned.length > 80) return "That name is too long.";
  if (!/^[\p{L}][\p{L}\s.'-]*$/u.test(cleaned)) return "Use a name with letters.";
  if (agents.some((agent) => agent.name.toLowerCase() === cleaned.toLowerCase())) return "That land agent already has access.";
  return null;
}

export function nextAgent(name: string, agents: LandAgent[]): LandAgent {
  const cleaned = name.trim().replace(/\s+/g, " ");
  const base = slug(cleaned);
  const taken = new Set(agents.map((agent) => agent.id));
  let id = base;
  let n = 2;
  while (taken.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return { id, name: cleaned, role: "agent" };
}
