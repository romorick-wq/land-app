"use client";

import { useState } from "react";
import { useCampaign } from "./CampaignProvider";
import { TitlePreview } from "./TitlePreview";
import { Modal, inputClass, labelClass } from "./ui";
import { parcelsForOwner } from "@/lib/filters";
import { formatAcres, uid } from "@/lib/format";
import type { Encumbrance, TitleInstrument } from "@/lib/types";

const TABS = ["Property", "Documents", "Chain of title", "Ownership", "Encumbrances", "Preview"] as const;

export function TitleReport() {
  const { titleOwnerId, owners, parcels, updateOwner, closeModals } = useCampaign();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Chain of title");
  const owner = owners.find((item) => item.id === titleOwnerId);
  if (!owner) return null;
  const owned = parcelsForOwner(parcels, owner.id);

  function setChain(chain: TitleInstrument[]) {
    updateOwner(owner!.id, { titleChain: chain });
  }

  function setEncumbrances(encumbrances: Encumbrance[]) {
    updateOwner(owner!.id, { encumbrances });
  }

  return (
    <Modal title="Title report" onClose={closeModals} width={920}>
      <div className="mb-3 text-sm">
        {owner.name}
        <span className="ml-2 text-xs text-white/45">{formatAcres(owned.reduce((sum, parcel) => sum + parcel.acres, 0))} acres</span>
      </div>
      <div className="mb-4 flex gap-1 overflow-x-auto">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs ${tab === item ? "bg-white text-black" : "bg-white/5 text-white/70"}`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Property" && (
        <div className="space-y-2 text-sm">
          <p>{owner.address || "No mailing address yet."}</p>
          <ul className="space-y-2 text-xs text-white/70">
            {owned.map((parcel) => (
              <li key={parcel.id} className="rounded-md border border-white/10 p-2">
                <div className="font-medium text-white">
                  {parcel.apn} · {formatAcres(parcel.acres)} ac
                </div>
                <div>{parcel.legal}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "Documents" && (
        <div>
          <p className="mb-2 text-xs text-white/50">File names are saved on this campaign. The files themselves stay on this computer.</p>
          <ul className="mb-3 space-y-1 text-sm">
            {owner.documents.map((document) => (
              <li key={document.name} className="flex items-center justify-between gap-2">
                <span className="truncate">{document.name}</span>
                <button
                  type="button"
                  className="text-xs text-white/50"
                  onClick={() => updateOwner(owner.id, { documents: owner.documents.filter((item) => item.name !== document.name) })}
                >
                  Remove
                </button>
              </li>
            ))}
            {owner.documents.length === 0 && <li className="text-xs text-white/40">No documents saved.</li>}
          </ul>
          <input
            type="file"
            multiple
            aria-label="Add document names"
            className="text-xs"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []).slice(0, 30 - owner.documents.length);
              if (!files.length) return;
              updateOwner(owner.id, {
                documents: [
                  ...owner.documents,
                  ...files.map((file) => ({ name: file.name.slice(0, 120), size: file.size })),
                ],
              });
              event.target.value = "";
            }}
          />
        </div>
      )}

      {tab === "Chain of title" && (
        <div className="space-y-3">
          {owner.titleChain.map((instrument, index) => (
            <fieldset key={instrument.id} className="rounded-md border border-white/10 p-3">
              <legend className="px-1 text-xs text-white/50">Instrument {index + 1}</legend>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {(
                  [
                    ["instrumentType", "Type"],
                    ["instDate", "Instrument date"],
                    ["recordDate", "Recorded"],
                    ["grantor", "Grantor"],
                    ["grantee", "Grantee"],
                    ["bookPage", "Book / page"],
                    ["tenancy", "Tenancy"],
                    ["minerals", "Minerals"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className={labelClass}>
                    {label}
                    <input
                      className={inputClass}
                      value={instrument[key]}
                      onChange={(event) =>
                        setChain(owner.titleChain.map((item) => (item.id === instrument.id ? { ...item, [key]: event.target.value } : item)))
                      }
                    />
                  </label>
                ))}
              </div>
              <label className={`${labelClass} mt-2`}>
                Legal description
                <textarea
                  className={`${inputClass} h-16 py-2`}
                  value={instrument.legalDescription}
                  onChange={(event) =>
                    setChain(owner.titleChain.map((item) => (item.id === instrument.id ? { ...item, legalDescription: event.target.value } : item)))
                  }
                />
              </label>
              <label className={`${labelClass} mt-2`}>
                Remarks
                <textarea
                  className={`${inputClass} h-16 py-2`}
                  value={instrument.remarks}
                  onChange={(event) =>
                    setChain(owner.titleChain.map((item) => (item.id === instrument.id ? { ...item, remarks: event.target.value } : item)))
                  }
                />
              </label>
              <label className="mt-2 flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={instrument.vestingDeed}
                  onChange={(event) =>
                    setChain(owner.titleChain.map((item) => (item.id === instrument.id ? { ...item, vestingDeed: event.target.checked } : item)))
                  }
                />
                Vesting deed
              </label>
              <button type="button" className="mt-2 text-xs text-white/50" onClick={() => setChain(owner.titleChain.filter((item) => item.id !== instrument.id))}>
                Remove instrument
              </button>
            </fieldset>
          ))}
          <button
            type="button"
            className="h-8 rounded-md border border-white/15 px-3 text-xs"
            onClick={() =>
              setChain([
                ...owner.titleChain,
                {
                  id: uid("t"),
                  instrumentType: "WD",
                  instDate: "",
                  recordDate: "",
                  grantor: "",
                  grantee: owner.name.toUpperCase(),
                  bookPage: "",
                  tenancy: "Not specified",
                  minerals: "Silent",
                  legalDescription: owned[0]?.legal ?? "",
                  remarks: "",
                  vestingDeed: owner.titleChain.every((item) => !item.vestingDeed),
                },
              ])
            }
          >
            Add instrument
          </button>
        </div>
      )}

      {tab === "Ownership" && (
        <div className="space-y-2 text-sm">
          <p>
            Current owner: <strong>{owner.name}</strong>
          </p>
          {owner.titleChain.filter((item) => item.vestingDeed).length === 0 && (
            <p className="text-xs text-white/50">No vesting deed is marked. Flag one in the chain.</p>
          )}
          {owner.titleChain
            .filter((item) => item.vestingDeed)
            .map((item) => (
              <p key={item.id} className="text-xs text-white/70">
                Vesting {item.instrumentType} from {item.grantor || "unknown grantor"} on {item.instDate || "an unknown date"}, {item.tenancy}. Minerals: {item.minerals}.
              </p>
            ))}
        </div>
      )}

      {tab === "Encumbrances" && (
        <div className="space-y-3">
          {owner.encumbrances.map((item) => (
            <div key={item.id} className="grid grid-cols-2 gap-2 rounded-md border border-white/10 p-3">
              {(
                [
                  ["type", "Type"],
                  ["holder", "Holder"],
                  ["recorded", "Recorded"],
                  ["bookPage", "Book / page"],
                  ["amount", "Amount"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className={labelClass}>
                  {label}
                  <input
                    className={inputClass}
                    value={item[key]}
                    onChange={(event) =>
                      setEncumbrances(owner.encumbrances.map((entry) => (entry.id === item.id ? { ...entry, [key]: event.target.value } : entry)))
                    }
                  />
                </label>
              ))}
              <label className={`${labelClass} col-span-2`}>
                Notes
                <textarea
                  className={`${inputClass} h-16 py-2`}
                  value={item.notes}
                  onChange={(event) =>
                    setEncumbrances(owner.encumbrances.map((entry) => (entry.id === item.id ? { ...entry, notes: event.target.value } : entry)))
                  }
                />
              </label>
              <button type="button" className="text-left text-xs text-white/50" onClick={() => setEncumbrances(owner.encumbrances.filter((entry) => entry.id !== item.id))}>
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="h-8 rounded-md border border-white/15 px-3 text-xs"
            onClick={() =>
              setEncumbrances([
                ...owner.encumbrances,
                { id: uid("e"), type: "Mortgage", holder: "", recorded: "", bookPage: "", amount: "", notes: "" },
              ])
            }
          >
            Add encumbrance
          </button>
        </div>
      )}

      {tab === "Preview" && (
        <div>
          <div className="mb-3 flex gap-2">
            <a href={`/title/${owner.id}`} target="_blank" rel="noreferrer" className="rounded-md bg-[#3ddc84] px-3 py-1.5 text-xs font-semibold text-black">
              Open printable report
            </a>
            <button type="button" className="rounded-md border border-white/15 px-3 py-1.5 text-xs" onClick={() => updateOwner(owner.id, { titleReviewedAt: new Date().toISOString() })}>
              Mark reviewed
            </button>
          </div>
          <TitlePreview owner={owner} parcels={owned} />
        </div>
      )}
    </Modal>
  );
}
