"use client";

import { clsx } from "clsx";
import Image from "next/image";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Aspect-ratio-locked, horizontally-scrollable frame for a garden map image.
 * Hotspot buttons are positioned inside it by percentage, so they stay
 * pixel-aligned with the picture at any render width. When `minDisplayWidth`
 * exceeds the viewport, the frame is shown at that width and scrolls instead
 * of shrinking hotspots below a comfortable tap size. */
export function HotspotMap({
  src,
  alt,
  width,
  height,
  minDisplayWidth,
  priority,
  children,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  minDisplayWidth?: number;
  priority?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto overflow-y-hidden rounded-2xl" style={{ WebkitOverflowScrolling: "touch" }}>
      <div
        className="relative select-none rounded-2xl shadow-inner ring-1 ring-bark-800/10"
        style={{
          width: "100%",
          maxWidth: `${width}px`,
          minWidth: minDisplayWidth ? `${minDisplayWidth}px` : undefined,
          aspectRatio: `${width} / ${height}`,
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 900px) 900px, 100vw"
          className="pointer-events-none rounded-2xl object-cover"
          draggable={false}
          priority={priority}
        />
        {children}
      </div>
    </div>
  );
}

interface HotspotProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  x: number;
  y: number;
  size: string;
}

/** One absolutely-positioned circular button anchored to an (x%, y%) point on a HotspotMap. */
export function Hotspot({ x, y, size, className, children, ...props }: HotspotProps) {
  return (
    <button
      type="button"
      style={{ left: `${x}%`, top: `${y}%`, width: size }}
      className={clsx(
        "absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
