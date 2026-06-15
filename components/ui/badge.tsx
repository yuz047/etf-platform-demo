import type { ReactNode } from "react";
import type { Status } from "@/lib/types";
import { statusClass, statusLabel } from "@/lib/health";
import { cn } from "@/lib/utils";

export function Badge({
  status,
  children,
  className
}: {
  status?: Status;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 max-w-full items-center rounded-md border px-2 text-xs font-medium",
        status ? statusClass[status] : "border-zinc-200 bg-white text-zinc-700",
        className
      )}
    >
      {children ?? (status ? statusLabel[status] : null)}
    </span>
  );
}
