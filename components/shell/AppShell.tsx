import type { ReactNode } from "react";
import type { Snapshot } from "@/lib/types";
import { SideNav } from "./SideNav";
import { StatusStrip } from "./StatusStrip";
import { TopCommandBar } from "./TopCommandBar";

export function AppShell({ snapshot, children }: { snapshot: Snapshot; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f6f7f9] text-zinc-950">
      <TopCommandBar snapshot={snapshot} />
      <div className="flex min-h-[calc(100vh-56px)] gap-4 px-4 pb-4">
        <SideNav />
        <main className="min-w-0 flex-1 pt-4">
          <StatusStrip snapshot={snapshot} />
          {children}
          <footer className="mx-4 mb-4 rounded-lg bg-white/85 px-4 py-3 text-xs leading-5 text-zinc-500 shadow-sm ring-1 ring-zinc-200/70">
            {snapshot.data_disclaimer}
          </footer>
        </main>
      </div>
    </div>
  );
}
