"use client";

import Link from "next/link";
import { useCampaign } from "./CampaignProvider";
import { CoverageMap } from "./CoverageMap";
import { campaignMetrics, pipelineHistory } from "@/lib/metrics";
import { STATUSES, statusMeta } from "@/lib/statuses";
import { formatAcres, formatDate, formatPercent } from "@/lib/format";
import { acresForOwner } from "@/lib/filters";

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const width = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-white/60">
        <span>{label}</span>
        <span>
          {typeof value === "number" && label.startsWith("Acres") ? formatAcres(value) : value}
          {total ? ` / ${label.startsWith("Acres") ? formatAcres(total) : total}` : ""}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${width}%`, background: color }} />
      </div>
    </div>
  );
}

export function DashboardView() {
  const { owners, parcels } = useCampaign();
  const metrics = campaignMetrics(owners, parcels);
  const weeks = pipelineHistory(metrics.byStatus);
  const maxStack = Math.max(...weeks.map((week) => STATUSES.reduce((sum, status) => sum + week.acres[status.id], 0)), 1);
  const maxSites = Math.max(...weeks.map((week) => week.sites), 1);

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Acquisition progress</h1>
          <p className="text-xs text-white/45">Earlier weeks are a paced history. This week uses the live campaign.</p>
        </div>
        <Link href="/" className="text-xs text-[#7dffb8]">
          Back to map
        </Link>
      </div>

      <section className="rounded-xl border border-white/10 bg-[#12171e] p-4">
        <h2 className="mb-3 text-xs uppercase tracking-wide text-white/45">Pipeline over time</h2>
        <div className="flex h-40 items-end gap-2">
          {weeks.map((week) => {
            const total = STATUSES.reduce((sum, status) => sum + week.acres[status.id], 0);
            return (
              <div key={week.label} className="flex h-full flex-1 flex-col justify-end">
                <div className="flex flex-col-reverse overflow-hidden rounded-sm" style={{ height: `${(total / maxStack) * 100}%` }}>
                  {STATUSES.map((status) => (
                    <div
                      key={status.id}
                      style={{
                        height: total ? `${(week.acres[status.id] / total) * 100}%` : 0,
                        background: status.color,
                      }}
                      title={`${status.label}: ${formatAcres(week.acres[status.id])} ac`}
                    />
                  ))}
                </div>
                <div className="mt-1 truncate text-center text-[10px] text-white/40">{week.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <Kpi label="Acres secured" value={formatAcres(metrics.securedAcres)} detail={`of ${formatAcres(metrics.totalAcres)} mapped`} tone="#22c55e" />
        <Kpi label="Agreements" value={String(metrics.agreements)} detail={`of ${metrics.leadCount} leads`} tone="#e8edf2" />
        <Kpi label="Site coverage" value={formatPercent(metrics.coverage)} detail="acquired acres / mapped acres" tone="#38bdf8" />
        <Kpi label="In progress" value={String(metrics.inProgressOwners)} detail={`${formatAcres(metrics.inProgressAcres)} acres`} tone="#f97316" />
      </section>

      <section className="grid gap-3 rounded-xl border border-white/10 bg-[#12171e] p-4">
        <Bar label="Acres secured" value={metrics.securedAcres} total={metrics.totalAcres} color="#22c55e" />
        <Bar label="Agreements signed" value={metrics.agreements} total={Math.max(metrics.leadCount, 1)} color="#a855f7" />
        <Bar label="Landowners contacted" value={metrics.contacted} total={Math.max(metrics.leadCount, 1)} color="#eab308" />
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#12171e] p-4">
          <h2 className="mb-3 text-xs uppercase tracking-wide text-white/45">Pipeline</h2>
          <ul className="space-y-2 text-sm">
            {STATUSES.map((status) => (
              <li key={status.id} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <i className="h-2.5 w-2.5 rounded-full" style={{ background: status.color }} />
                  {status.label}
                </span>
                <span className="text-white/60">
                  {metrics.byStatus[status.id].owners} owners · {formatAcres(metrics.byStatus[status.id].acres)} ac
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#12171e] p-4">
          <h2 className="mb-3 text-xs uppercase tracking-wide text-white/45">Weekly sites secured</h2>
          <div className="flex h-36 items-end gap-2">
            {weeks.map((week) => (
              <div key={week.label} className="flex h-full flex-1 flex-col justify-end">
                <div className="rounded-sm bg-[#3ddc84]" style={{ height: `${(week.sites / maxSites) * 100}%` }} />
                <div className="mt-1 text-center text-[10px] text-white/40">{week.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#12171e] p-4">
          <h2 className="mb-3 text-xs uppercase tracking-wide text-white/45">Recent agreements</h2>
          <ul className="space-y-2 text-sm">
            {metrics.recent.length === 0 && <li className="text-xs text-white/45">Generate an agreement from an owner to list it here.</li>}
            {metrics.recent.map((owner) => (
              <li key={owner.id} className="flex items-center justify-between gap-3">
                <span>
                  <i className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: statusMeta(owner.status).color }} />
                  {owner.name}
                </span>
                <span className="text-xs text-white/45">
                  {formatDate(owner.agreementGeneratedAt)} · {formatAcres(acresForOwner(parcels, owner.id))} ac
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#12171e] p-4">
          <h2 className="mb-3 text-xs uppercase tracking-wide text-white/45">Coverage map</h2>
          <CoverageMap parcels={parcels} owners={owners} />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          ["Briefing", "Where community sentiment stands and what to do next.", "/pulse#briefing"],
          ["Stakeholders", "Who is speaking up around the project.", "/pulse#stakeholders"],
          ["Sentiment", "How the score has moved this season.", "/pulse#overview"],
        ].map(([title, copy, href]) => (
          <Link key={title} href={href} className="rounded-xl border border-white/10 bg-[#12171e] p-4 hover:border-white/25">
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="mt-1 text-xs text-white/50">{copy}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

function Kpi({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#12171e] p-4">
      <div className="text-[11px] uppercase tracking-wide text-white/40">{label}</div>
      <div className="mt-1 text-2xl font-semibold" style={{ color: tone }}>
        {value}
      </div>
      <div className="mt-1 text-xs text-white/45">{detail}</div>
    </div>
  );
}
