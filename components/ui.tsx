"use client";

export const inputClass =
  "h-8 w-full rounded-md border border-white/10 bg-[#0e131a] px-2 text-xs text-white outline-none focus:border-[#3ddc84]";

export const labelClass = "mb-1 block text-[11px] uppercase tracking-wide text-white/45";

export function Modal({
  title,
  onClose,
  children,
  width = 640,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-[#161b22] shadow-2xl"
        style={{ maxWidth: width }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button type="button" className="px-2 text-lg leading-none text-white/60 hover:text-white" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="min-h-0 overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}
