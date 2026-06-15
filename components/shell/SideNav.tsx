import Link from "next/link";
import { Activity, ClipboardList, Database, FlaskConical, Inbox, Workflow } from "lucide-react";
import { navItems } from "@/lib/routes";

const icons = {
  Control: Activity,
  Events: Inbox,
  Rules: ClipboardList,
  Workflow,
  Backtest: FlaskConical,
  "Data Quality": Database
};

export function SideNav() {
  return (
    <nav className="hidden w-44 shrink-0 border-r border-zinc-200 bg-zinc-50 px-3 py-4 md:block">
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = icons[item.label as keyof typeof icons];
          return (
            <Link
              className="flex h-9 items-center gap-2 rounded-md px-2 text-sm text-zinc-700 hover:bg-white hover:text-zinc-950"
              href={item.href}
              key={item.href}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
