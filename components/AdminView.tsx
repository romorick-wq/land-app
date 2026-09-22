"use client";

import { useState } from "react";
import Link from "next/link";
import { useCampaign } from "./CampaignProvider";
import { inputClass, labelClass } from "./ui";
import { ADMIN_LABEL, agentInitials } from "@/lib/agents";

export function AdminView() {
  const { agents, addAgent, removeAgent } = useCampaign();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const message = addAgent(name);
    if (message) {
      setError(message);
      return;
    }
    setName("");
    setError(null);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Land agents</h1>
          <p className="text-xs text-white/45">{ADMIN_LABEL} can grant or remove access for other land agents on this browser.</p>
        </div>
        <Link href="/" className="text-xs text-[#7dffb8]">
          Back to map
        </Link>
      </div>

      <form onSubmit={submit} className="rounded-xl border border-white/10 bg-[#12171e] p-4">
        <label className={labelClass} htmlFor="agent-name">
          Add a land agent
        </label>
        <div className="flex gap-2">
          <input
            id="agent-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            className={inputClass}
            autoComplete="off"
          />
          <button type="submit" className="h-8 shrink-0 rounded-md bg-[#3ddc84] px-3 text-xs font-semibold text-black">
            Add access
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      </form>

      <ul className="divide-y divide-white/10 rounded-xl border border-white/10 bg-[#12171e]">
        {agents.map((agent) => {
          const pending = pendingId === agent.id;
          return (
            <li key={agent.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#3ddc84] text-[11px] font-bold text-black">
                {agentInitials(agent.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{agent.role === "admin" ? ADMIN_LABEL : agent.name}</p>
                <p className="text-[11px] text-white/45">{agent.role === "admin" ? "Admin" : "Land agent"}</p>
              </div>
              {agent.role === "admin" ? (
                <span className="text-[11px] text-white/40">Cannot remove</span>
              ) : (
                <button
                  type="button"
                  className={`h-8 rounded-md px-2 text-xs ${pending ? "bg-red-500 font-semibold text-white" : "border border-white/10 text-white/80"}`}
                  onClick={() => {
                    if (!pending) {
                      setPendingId(agent.id);
                      return;
                    }
                    removeAgent(agent.id);
                    setPendingId(null);
                  }}
                >
                  {pending ? "Confirm remove" : "Remove access"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
