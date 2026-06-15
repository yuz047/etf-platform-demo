import type { ReactNode } from "react";
import type { Snapshot } from "@/lib/types";
import { SideNav } from "./SideNav";
import { StatusStrip } from "./StatusStrip";
import { TopCommandBar } from "./TopCommandBar";

export function AppShell({ snapshot, children }: { snapshot: Snapshot; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950">
      <TopCommandBar snapshot={snapshot} />
      <div className="flex min-h-[calc(100vh-56px)]">
        <SideNav />
        <main className="min-w-0 flex-1">
          <StatusStrip snapshot={snapshot} />
          {children}
          <footer className="border-t border-zinc-200 bg-white px-4 py-3 text-xs leading-5 text-zinc-500">
            {snapshot.data_disclaimer}
          </footer>
        </main>
      </div>
    </div>
  );
}
