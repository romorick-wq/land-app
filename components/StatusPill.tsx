import { statusMeta } from "@/lib/statuses";
import type { StatusId } from "@/lib/types";

export function StatusPill({ status }: { status: StatusId }) {
  const meta = statusMeta(status);
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ background: `${meta.color}22`, color: meta.color }}
    >
      {meta.label}
    </span>
  );
}
