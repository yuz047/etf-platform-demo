import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Snapshot } from "@/lib/types";
import { shortDateTime } from "@/lib/formatting";

export function TopCommandBar({ snapshot }: { snapshot: Snapshot }) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200/70 bg-white/90 px-4 shadow-[0_1px_0_rgba(24,24,27,0.03)] backdrop-blur">
      <div className="flex min-w-0 items-center gap-4">
        <div className="border-l-2 border-blue-600 pl-3">
          <div className="text-sm font-semibold text-zinc-950">ETF Tower</div>
          <div className="text-xs text-zinc-500">Daily Control Tower</div>
        </div>
        <div className="hidden h-8 min-w-80 items-center gap-2 rounded-md bg-zinc-50 px-2 text-xs text-zinc-500 shadow-sm ring-1 ring-zinc-200/70 md:flex">
          <Search className="h-3.5 w-3.5" />
          Cmd/Ctrl+K or / to search
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-zinc-600">
        <span>As of {snapshot.as_of}</span>
        <span className="hidden lg:inline">{shortDateTime(snapshot.generated_at)}</span>
        <Badge>{snapshot.environment.toUpperCase()}</Badge>
      </div>
    </header>
  );
}
