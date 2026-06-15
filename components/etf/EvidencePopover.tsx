import type { Evidence } from "@/lib/types";

export function EvidencePopover({ evidence }: { evidence: Evidence }) {
  return (
    <span className="inline-flex max-w-full items-center rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700" title={`${evidence.title} · ${evidence.raw_path ?? "no raw path"}`}>
      {evidence.id}
    </span>
  );
}
