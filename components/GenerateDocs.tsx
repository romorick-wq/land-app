"use client";

import { useCampaign } from "./CampaignProvider";
import { Modal, inputClass, labelClass } from "./ui";
import { formatDate } from "@/lib/format";
import { PROJECT } from "@/lib/statuses";

export function GenerateDocs() {
  const { docsOwnerId, owners, updateOwner, closeModals } = useCampaign();
  const owner = owners.find((item) => item.id === docsOwnerId);
  if (!owner) return null;

  function openGenerated(path: string, stamp: "agreementGeneratedAt" | "exhibitGeneratedAt") {
    updateOwner(owner!.id, { [stamp]: new Date().toISOString() });
    window.open(path, "_blank", "noopener,noreferrer");
  }

  return (
    <Modal title="Generate documents" onClose={closeModals} width={560}>
      <h3 className="text-base font-semibold">{owner.name}</h3>
      <p className="mt-1 text-xs text-white/45">{PROJECT.name}</p>

      <section className="mt-4 rounded-md border border-white/10 p-3 text-sm">
        <div className="font-medium">Agreement template</div>
        <p className="mt-1 text-xs text-white/50">Surface use and access agreement. Fields come from this owner and the parcels on the map.</p>
        <button
          type="button"
          className="mt-3 h-8 rounded-md bg-[#3ddc84] px-3 text-xs font-semibold text-black"
          onClick={() => openGenerated(`/agreement/${owner.id}`, "agreementGeneratedAt")}
        >
          Generate
        </button>
        {owner.agreementGeneratedAt && <p className="mt-2 text-xs text-white/45">Last generated {formatDate(owner.agreementGeneratedAt)}</p>}
      </section>

      <label className={`${labelClass} mt-4`}>
        Special provisions
        <textarea
          className={`${inputClass} h-20 py-2`}
          value={owner.specialProvisions}
          onChange={(event) => updateOwner(owner.id, { specialProvisions: event.target.value })}
          placeholder="Tile protection, access road, screening..."
        />
      </label>

      <section className="mt-4 rounded-md border border-white/10 p-3 text-sm">
        <div className="font-medium">Exhibit A map</div>
        <p className="mt-1 text-xs text-white/50">A printable map of this owner&apos;s parcels.</p>
        <button
          type="button"
          className="mt-3 h-8 rounded-md border border-white/15 px-3 text-xs"
          onClick={() => openGenerated(`/exhibit/${owner.id}`, "exhibitGeneratedAt")}
        >
          Generate Exhibit A
        </button>
      </section>

      <section className="mt-4 rounded-md border border-white/10 p-3 text-sm">
        <div className="font-medium">Notarization request</div>
        <p className="mt-1 text-xs text-white/50">
          This records a request on the campaign. A live remote notary is not connected.
        </p>
        <button
          type="button"
          className="mt-3 h-8 rounded-md border border-white/15 px-3 text-xs disabled:opacity-50"
          disabled={Boolean(owner.notarizationRequestedAt)}
          onClick={() => updateOwner(owner.id, { notarizationRequestedAt: new Date().toISOString() })}
        >
          {owner.notarizationRequestedAt ? `Requested ${formatDate(owner.notarizationRequestedAt)}` : "Request notarization"}
        </button>
      </section>
    </Modal>
  );
}
