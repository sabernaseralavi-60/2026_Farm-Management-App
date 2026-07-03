import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "green" | "brown" | "water" | "soft" | "red" | "ghost";

const VARIANT_CLASS: Record<Variant, string> = {
  green: "bg-leaf-600 text-white hover:bg-leaf-700",
  brown: "bg-bark-600 text-white hover:bg-bark-700",
  water: "bg-water-600 text-white hover:bg-water-700",
  soft: "bg-sand-200 text-bark-700 hover:bg-sand-300",
  red: "bg-red-600 text-white hover:bg-red-700",
  ghost: "bg-transparent text-bark-600 hover:bg-sand-100",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}

export function Button({ variant = "green", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-bold shadow-[0_4px_14px_rgba(0,0,0,0.1)] transition-all active:scale-[0.97] hover:brightness-105 disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" && "px-4 py-2 text-fluid-sm",
        size === "md" && "px-5 py-3 text-fluid-sm",
        size === "lg" && "px-6 py-4 text-fluid-base",
        VARIANT_CLASS[variant],
        className,
      )}
      {...props}
    />
  );
}
