"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ClipboardList, Database, FlaskConical, Inbox, Workflow } from "lucide-react";
import { navItems } from "@/lib/routes";
import { cn } from "@/lib/utils";

const icons = {
  Control: Activity,
  Events: Inbox,
  Rules: ClipboardList,
  Workflow,
  Backtest: FlaskConical,
  "Data Quality": Database
};

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden w-52 shrink-0 bg-zinc-50/80 px-3 py-4 shadow-[inset_-1px_0_0_rgba(228,228,231,0.7)] md:block">
      <div className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = icons[item.label as keyof typeof icons];
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              className={cn(
                "flex h-9 items-center gap-2 rounded-md px-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-white/80 hover:text-zinc-950",
                active && "bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200/70"
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className={cn("h-4 w-4 text-zinc-400", active && "text-blue-600")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
