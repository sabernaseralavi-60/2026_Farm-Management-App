import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "glass rounded-3xl p-5 sm:p-7 transition-shadow hover:shadow-[var(--shadow-glass-lg)]",
        className,
      )}
      {...props}
    />
  );
}
