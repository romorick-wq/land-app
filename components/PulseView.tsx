"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BRIEFING, SENTIMENT_SERIES, STAKEHOLDERS, type Stakeholder } from "@/lib/pulse";
import { PROJECT } from "@/lib/statuses";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "stakeholders", label: "Stakeholders" },
  { id: "briefing", label: "Briefing" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function tone(sentiment: Stakeholder["sentiment"]) {
  if (sentiment === "Positive") return "#3ddc84";
  if (sentiment === "Negative") return "#f87171";
  return "#fbbf24";
}

export function PulseView() {
  const [tab, setTab] = useState<TabId>("overview");

  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (id === "overview" || id === "stakeholders" || id === "briefing") setTab(id);
  }, []);

  const width = 640;
  const height = 180;
  const min = -1;
  const max = 1;
  const points = SENTIMENT_SERIES.map((point, index) => {
    const x = (index / (SENTIMENT_SERIES.length - 1)) * (width - 24) + 12;
    const y = ((max - point.score) / (max - min)) * (height - 24) + 12;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="mx-auto max-w-5xl px-4 py-5">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-lg font-semibold">Community Pulse</h1>
          <p className="text-xs text-white/45">
            {PROJECT.name} · sample briefing, not a live news or social feed
          </p>
        </div>
        <Link href="/" className="text-xs text-[#7dffb8]">
          Back to map
        </Link>
      </div>
      <div className="mb-4 flex gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              window.history.replaceState(null, "", `#${item.id}`);
            }}
            className={`rounded-full px-3 py-1 text-xs ${tab === item.id ? "bg-white text-black" : "bg-white/5 text-white/70"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <section id="overview" className="rounded-xl border border-white/10 bg-[#12171e] p-4">
          <h2 className="mb-3 text-xs uppercase tracking-wide text-white/45">Sentiment</h2>
          <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full">
            <line x1="12" x2={width - 12} y1={height / 2} y2={height / 2} stroke="rgba(255,255,255,0.12)" />
            <polyline fill="none" stroke="#fbbf24" strokeWidth="3" points={points} />
            {SENTIMENT_SERIES.map((point, index) => {
              const [x, y] = points.split(" ")[index].split(",");
              return <circle key={point.label} cx={x} cy={y} r="4" fill="#fbbf24" />;
            })}
          </svg>
          <div className="mt-2 flex justify-between text-[11px] text-white/40">
            {SENTIMENT_SERIES.map((point) => (
              <span key={point.label}>
                {point.label}
                <span className="block text-white/70">{point.score.toFixed(2)}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {tab === "stakeholders" && (
        <ul id="stakeholders" className="divide-y divide-white/10 rounded-xl border border-white/10 bg-[#12171e]">
          {STAKEHOLDERS.map((person) => (
            <li key={person.id} className="grid gap-2 px-4 py-3 md:grid-cols-[1fr_auto]">
              <div>
                <div className="text-sm font-medium">{person.name}</div>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded bg-white/10 px-2 py-0.5">{person.kind}</span>
                  <span style={{ color: tone(person.sentiment) }}>{person.sentiment}</span>
                  <span className="text-white/40">{person.role}</span>
                </div>
                <p className="mt-1 text-xs text-white/60">{person.note}</p>
              </div>
              <div className="text-right text-sm font-semibold" style={{ color: tone(person.sentiment) }}>
                {person.score > 0 ? "+" : ""}
                {person.score.toFixed(2)}
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === "briefing" && (
        <article id="briefing" className="space-y-4 rounded-xl border border-white/10 bg-[#12171e] p-4 text-sm">
          <section>
            <h2 className="text-xs uppercase tracking-wide text-white/45">Summary</h2>
            <p className="mt-2 text-white/80">{BRIEFING.summary}</p>
          </section>
          <Section title="Risks" items={BRIEFING.risks} />
          <Section title="Opportunities" items={BRIEFING.opportunities} />
          <Section title="Recommended actions" items={BRIEFING.actions} />
        </article>
      )}
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h2 className="text-xs uppercase tracking-wide text-white/45">{title}</h2>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-white/80">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </section>
  );
}
