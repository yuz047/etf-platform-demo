import { Button as HeroButton, type ButtonProps as HeroButtonProps } from "@heroui/react";
import { cn } from "@/lib/utils";

type ButtonProps = Omit<HeroButtonProps, "isDisabled" | "size" | "variant"> & {
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost";
};

const variantMap = {
  default: "primary",
  outline: "outline",
  ghost: "ghost"
} as const;

export function Button({ className, disabled, type = "button", variant = "default", ...props }: ButtonProps) {
  return (
    <HeroButton
      className={cn(
        "h-8 rounded-md px-3 text-xs font-medium shadow-none",
        variant === "default" && "bg-zinc-950 text-white hover:bg-zinc-800",
        variant === "outline" && "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50",
        variant === "ghost" && "text-zinc-700 hover:bg-zinc-100",
        className
      )}
      isDisabled={disabled}
      size="sm"
      type={type}
      variant={variantMap[variant]}
      {...props}
    />
  );
}
