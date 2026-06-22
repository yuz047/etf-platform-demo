import type { HTMLAttributes } from "react";
import { Card } from "@heroui/react";
import { cn } from "@/lib/utils";

export function Panel({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <Card className={cn("rounded-md border border-zinc-200 bg-white shadow-none", className)} variant="default" {...props}>
      {children}
    </Card>
  );
}

export function PanelHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <Card.Header
      className={cn("flex min-h-11 items-center justify-between gap-3 border-b border-zinc-200 px-4", className)}
      {...props}
    />
  );
}

export function PanelTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <Card.Title className={cn("text-sm font-semibold text-zinc-950", className)} {...props} />;
}

export function PanelBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <Card.Content className={cn("p-4", className)} {...props} />;
}
