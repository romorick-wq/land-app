import { PROJECT } from "@/lib/statuses";
import { formatAcres, formatDate } from "@/lib/format";
import type { Owner, Parcel } from "@/lib/types";

export function TitlePreview({ owner, parcels }: { owner: Owner; parcels: Parcel[] }) {
  const acres = parcels.reduce((sum, parcel) => sum + parcel.acres, 0);
  return (
    <article className="rounded-lg border border-white/10 bg-[#0e131a] p-4 text-sm print:border-0 print:bg-white print:text-black">
      <p className="text-xs uppercase tracking-[0.2em] text-rose-300 print:text-rose-700">Title report</p>
      <h3 className="mt-1 text-lg font-semibold">{owner.name}</h3>
      <p className="text-xs text-white/45 print:text-neutral-500">
        {PROJECT.name} · {PROJECT.place}
        {owner.titleReviewedAt ? ` · Reviewed ${formatDate(owner.titleReviewedAt)}` : ""}
      </p>
      <section className="mt-4">
        <h4 className="text-xs uppercase tracking-wide text-white/45 print:text-neutral-500">Property summary</h4>
        <dl className="mt-2 grid grid-cols-[140px_1fr] gap-y-1 text-xs">
          <dt className="text-white/45 print:text-neutral-500">Parcels</dt>
          <dd>{parcels.map((parcel) => parcel.apn).join(", ") || "—"}</dd>
          <dt className="text-white/45 print:text-neutral-500">Owner</dt>
          <dd>{owner.name}</dd>
          <dt className="text-white/45 print:text-neutral-500">Address</dt>
          <dd>{owner.address || "—"}</dd>
          <dt className="text-white/45 print:text-neutral-500">Acreage</dt>
          <dd>{formatAcres(acres)}</dd>
        </dl>
      </section>
      <section className="mt-4">
        <h4 className="text-xs uppercase tracking-wide text-white/45 print:text-neutral-500">Chain of title</h4>
        {owner.titleChain.length === 0 && <p className="mt-2 text-xs text-white/50">No instruments entered.</p>}
        <ol className="mt-2 space-y-3">
          {owner.titleChain.map((instrument, index) => (
            <li key={instrument.id} className="rounded-md border border-white/10 p-3 text-xs print:border-neutral-300">
              <div className="font-semibold">
                {index + 1}. {instrument.instrumentType || "Instrument"}
                {instrument.vestingDeed ? " · Vesting" : ""}
              </div>
              <p className="mt-1">
                {instrument.grantor || "—"} to {instrument.grantee || "—"}
              </p>
              <p className="text-white/55 print:text-neutral-600">
                {instrument.instDate || "—"} recorded {instrument.recordDate || "—"} · {instrument.bookPage || "no book/page"}
              </p>
              <p className="mt-1">{instrument.legalDescription}</p>
              {instrument.remarks && <p className="mt-1 text-white/70 print:text-neutral-700">{instrument.remarks}</p>}
            </li>
          ))}
        </ol>
      </section>
      <section className="mt-4">
        <h4 className="text-xs uppercase tracking-wide text-white/45 print:text-neutral-500">Encumbrances</h4>
        {owner.encumbrances.length === 0 && <p className="mt-2 text-xs text-white/50">None listed.</p>}
        <ul className="mt-2 space-y-2 text-xs">
          {owner.encumbrances.map((item) => (
            <li key={item.id}>
              <span className="font-medium">{item.type}</span> · {item.holder} · {item.amount} · {item.bookPage}
              <div className="text-white/55 print:text-neutral-600">{item.notes}</div>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
