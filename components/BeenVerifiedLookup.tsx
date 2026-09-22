"use client";

import { useState } from "react";
import { BEENVERIFIED_HOME, beenVerifiedPeople, beenVerifiedSearchUrl } from "@/lib/beenverified";
import { inputClass, labelClass } from "./ui";
import type { Owner } from "@/lib/types";

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function BeenVerifiedLookup({ owner, onSave }: { owner: Owner; onSave: (patch: Partial<Owner>) => void }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const people = beenVerifiedPeople(owner.name);

  function save() {
    const phones = unique([phone, ...owner.lookup.phones]);
    const emails = unique([email, ...owner.lookup.emails]);
    const addresses = unique([address, ...owner.lookup.addresses]);
    onSave({
      phone: phone.trim() || owner.phone,
      email: email.trim() || owner.email,
      address: address.trim() || owner.address,
      lookup: { phones, emails, addresses },
    });
    setPhone("");
    setEmail("");
    setAddress("");
  }

  return (
    <div className="mt-2">
      <button type="button" className="text-xs text-[#7dffb8]" onClick={() => setOpen((current) => !current)}>
        {open ? "Hide BeenVerified" : "BeenVerified"}
      </button>
      {open && (
        <div className="mt-2 space-y-2 rounded-md border border-white/10 bg-black/20 p-2 text-xs">
          <p className="leading-5 text-white/55">
            Opens BeenVerified in your account for this owner in Nevada. Paste the phone, email, and address from the report to save them on this lead.
          </p>
          {people.length === 0 && (
            <a className="block text-[#7dffb8]" href={BEENVERIFIED_HOME} target="_blank" rel="noreferrer">
              Open BeenVerified people search
            </a>
          )}
          {people.map((person) => (
            <a
              key={`${person.first}-${person.last}`}
              className="block text-[#7dffb8]"
              href={beenVerifiedSearchUrl(person)}
              target="_blank"
              rel="noreferrer"
            >
              Look up {person.label}
            </a>
          ))}
          <label className={labelClass}>
            Phone from BeenVerified
            <input className={inputClass} value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          <label className={labelClass}>
            Email from BeenVerified
            <input className={inputClass} value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className={labelClass}>
            Address from BeenVerified
            <textarea className={`${inputClass} h-16 py-2`} value={address} onChange={(event) => setAddress(event.target.value)} />
          </label>
          <button
            type="button"
            className="h-8 rounded-md bg-[#3ddc84] px-3 text-xs font-semibold text-black disabled:opacity-40"
            disabled={!phone.trim() && !email.trim() && !address.trim()}
            onClick={save}
          >
            Save on this lead
          </button>
        </div>
      )}
    </div>
  );
}
