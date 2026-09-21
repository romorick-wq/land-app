"use client";

import { useParams } from "next/navigation";
import { useCampaign } from "@/components/CampaignProvider";
import { acresForOwner, parcelsForOwner } from "@/lib/filters";
import { formatAcres, formatDate } from "@/lib/format";
import { PROJECT } from "@/lib/statuses";

export default function AgreementPage() {
  const params = useParams<{ ownerId: string }>();
  const { owners, parcels } = useCampaign();
  const owner = owners.find((item) => item.id === params.ownerId);
  if (!owner) return <p className="p-8 text-sm">That owner is not in this campaign.</p>;
  const owned = parcelsForOwner(parcels, owner.id);

  return (
    <main className="mx-auto max-w-3xl bg-white px-8 py-10 text-neutral-900 print:px-0">
      <div className="no-print mb-6 flex gap-2">
        <button type="button" className="rounded bg-neutral-900 px-3 py-1.5 text-xs text-white" onClick={() => window.print()}>
          Print / Save PDF
        </button>
        <a href="/" className="rounded border border-neutral-300 px-3 py-1.5 text-xs">
          Back to map
        </a>
      </div>
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{PROJECT.name}</p>
      <h1 className="mt-2 text-2xl font-semibold">Surface Use and Access Agreement</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Worksheet filled from the campaign record on {formatDate(owner.agreementGeneratedAt) || formatDate(new Date().toISOString())}. Have counsel review it before anyone signs.
      </p>
      <dl className="mt-6 grid grid-cols-[160px_1fr] gap-y-2 text-sm">
        <dt className="text-neutral-500">Owner</dt>
        <dd>{owner.name}</dd>
        <dt className="text-neutral-500">Mailing address</dt>
        <dd>{owner.address || "—"}</dd>
        <dt className="text-neutral-500">Phone</dt>
        <dd>{owner.phone || "—"}</dd>
        <dt className="text-neutral-500">Email</dt>
        <dd>{owner.email || "—"}</dd>
        <dt className="text-neutral-500">Acreage</dt>
        <dd>{formatAcres(acresForOwner(parcels, owner.id))}</dd>
      </dl>
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide">Parcels</h2>
      <table className="mt-2 w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-300 text-xs uppercase text-neutral-500">
            <th className="py-2">APN</th>
            <th>Acres</th>
            <th>Legal description</th>
          </tr>
        </thead>
        <tbody>
          {owned.map((parcel) => (
            <tr key={parcel.id} className="border-b border-neutral-200 align-top">
              <td className="py-2 pr-3">{parcel.apn}</td>
              <td className="pr-3">{formatAcres(parcel.acres)}</td>
              <td>{parcel.legal}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide">Special provisions</h2>
      <p className="mt-2 text-sm">{owner.specialProvisions || "None added."}</p>
      <div className="mt-12 grid gap-10 sm:grid-cols-2">
        <div>
          <div className="border-b border-neutral-400 pb-8" />
          <p className="mt-2 text-xs">Owner signature · {owner.name}</p>
        </div>
        <div>
          <div className="border-b border-neutral-400 pb-8" />
          <p className="mt-2 text-xs">Company signature</p>
        </div>
      </div>
    </main>
  );
}
