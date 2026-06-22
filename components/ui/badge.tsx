import type { ReactNode } from "react";
import { Chip, type ChipProps } from "@heroui/react";
import type { Status } from "@/lib/types";
import { statusLabel } from "@/lib/health";
import { cn } from "@/lib/utils";

const statusColor: Record<Status, ChipProps["color"]> = {
  blue: "accent",
  green: "success",
  grey: "default",
  red: "danger",
  yellow: "warning"
};

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
    <Chip
      className={cn(
        "h-6 max-w-full rounded-md border px-2 text-xs font-medium",
        !status && "border-zinc-200 bg-white text-zinc-700",
        className
      )}
      color={status ? statusColor[status] : "default"}
      size="sm"
      variant="soft"
    >
      {children ?? (status ? statusLabel[status] : null)}
    </Chip>
  );
}
