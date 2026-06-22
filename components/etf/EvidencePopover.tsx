import type { Evidence } from "@/lib/types";

export function EvidencePopover({ evidence }: { evidence: Evidence }) {
  return (
    <span className="inline-flex max-w-full items-center rounded-md bg-zinc-50 px-2 py-1 text-xs text-zinc-700 ring-1 ring-zinc-200/70" title={`${evidence.title} · ${evidence.raw_path ?? "no raw path"}`}>
      {evidence.id}
    </span>
  );
}
