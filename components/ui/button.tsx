import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "bg-zinc-950 text-white hover:bg-zinc-800",
        variant === "outline" && "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50",
        variant === "ghost" && "text-zinc-700 hover:bg-zinc-100",
        className
      )}
      {...props}
    />
  );
}
