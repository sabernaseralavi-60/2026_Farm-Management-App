export function ModuleHero({
  icon,
  title,
  subtitle,
  from,
  to,
}: {
  icon: string;
  title: string;
  subtitle: string;
  from: string;
  to: string;
}) {
  return (
    <div
      className="relative mb-6 overflow-hidden rounded-3xl px-6 py-7 sm:px-9 sm:py-9 text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {/* soft dot texture, matches the app-wide glass/pattern language */}
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,.9) 1.2px, transparent 1.2px)",
          backgroundSize: "20px 20px",
        }}
      />
      {/* shimmer sweep */}
      <div
        className="absolute inset-0 animate-shimmer opacity-20"
        style={{
          background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,.5) 50%, transparent 70%)",
        }}
      />
      {/* glow blobs */}
      <div className="absolute -top-16 right-10 h-40 w-40 rounded-full bg-white/25 blur-2xl" />
      <div className="absolute -bottom-14 left-16 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
      {/* giant faint background icon */}
      <div className="pointer-events-none absolute -left-4 top-1/2 -translate-y-1/2 select-none text-[8rem] sm:text-[10rem] opacity-[0.16]" aria-hidden>
        {icon}
      </div>

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-3 text-fluid-xl font-extrabold drop-shadow-sm">
            <span aria-hidden>{icon}</span> {title}
          </h2>
          <p className="mt-1.5 text-fluid-sm text-white/90">{subtitle}</p>
        </div>
        <div className="hidden sm:flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/15 text-4xl shadow-inner backdrop-blur-md">
          <span aria-hidden>{icon}</span>
        </div>
      </div>
    </div>
  );
}
