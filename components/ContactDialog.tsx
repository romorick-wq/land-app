"use client";

import { useState } from "react";
import { useCampaign } from "./CampaignProvider";
import { Modal, inputClass, labelClass } from "./ui";

const REACTIONS = ["Interested", "Neutral", "Not interested", "No answer", "Call back"];

export function ContactDialog() {
  const { contactOwnerId, owners, updateOwner, closeModals } = useCampaign();
  const owner = owners.find((item) => item.id === contactOwnerId);
  const [reaction, setReaction] = useState(REACTIONS[0]);
  const [notes, setNotes] = useState("");
  if (!owner) return null;

  function save() {
    const stamp = new Date();
    const line = `${stamp.toLocaleString()}: ${reaction}${notes.trim() ? `. ${notes.trim()}` : ""}`;
    updateOwner(owner!.id, {
      notes: owner!.notes ? `${owner!.notes}\n${line}` : line,
      contactLogged: { reaction, notes: notes.trim(), at: stamp.toISOString() },
      status: owner!.status === "available" ? "under_review" : owner!.status,
    });
    closeModals();
  }

  return (
    <Modal title="Initial contact" onClose={closeModals}>
      <p className="mb-3 text-sm">{owner.name}</p>
      <label className={labelClass}>
        Reaction
        <select className={inputClass} value={reaction} onChange={(event) => setReaction(event.target.value)}>
          {REACTIONS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <label className={`${labelClass} mt-3`}>
        Notes
        <textarea className={`${inputClass} h-24 py-2`} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>
      <button type="button" className="mt-4 h-9 rounded-md bg-[#3ddc84] px-4 text-xs font-semibold text-black" onClick={save}>
        Save contact
      </button>
    </Modal>
  );
}
