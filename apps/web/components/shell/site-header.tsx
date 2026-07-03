export function SiteHeader() {
  return (
    <header className="relative flex h-56 sm:h-64 items-center justify-center overflow-hidden text-center">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(165deg,#0f2027 0%,#2c2113 28%,#6b4423 55%,#c97f3a 80%,#f3b563 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,.7) 1.2px, transparent 1.2px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        className="absolute left-1/2 -top-44 h-[480px] w-[480px] -translate-x-1/2 rounded-full blur-[4px]"
        style={{ background: "radial-gradient(circle, rgba(255,210,130,.55), rgba(255,210,130,0) 70%)" }}
      />
      <svg
        className="absolute inset-0 h-full w-full opacity-95 drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)]"
        viewBox="0 0 1200 260"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="palmGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2d4a2e" />
            <stop offset="100%" stopColor="#10210f" />
          </linearGradient>
          <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1c140b" />
            <stop offset="100%" stopColor="#0d0905" />
          </linearGradient>
          <path id="frond" d="M0,0 Q46,-9 88,4 Q46,12 0,5 Z" fill="url(#palmGrad)" />
          <g id="palm">
            <rect x="-3.5" y="4" width="7" height="156" rx="3.5" fill="url(#palmGrad)" />
            <g transform="translate(0,6)">
              {[-100, -72, -44, -16, 16, 44, 72, 100, 140, -140].map((r) => (
                <use key={r} href="#frond" transform={`rotate(${r})`} />
              ))}
            </g>
          </g>
        </defs>
        <circle cx="600" cy="70" r="46" fill="#ffd9a0" opacity=".9" />
        <circle cx="600" cy="70" r="46" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="10" />
        {[
          [110, 112, 1.0],
          [290, 122, 1.18],
          [470, 106, 0.85],
          [650, 124, 1.05],
          [830, 108, 0.9],
          [1000, 120, 1.12],
          [1150, 110, 0.92],
        ].map(([x, y, s]) => (
          <use key={x} href="#palm" transform={`translate(${x},${y}) scale(${s})`} />
        ))}
        <rect x="0" y="232" width="1200" height="40" fill="url(#groundGrad)" />
        <rect x="0" y="230" width="1200" height="3" fill="#f3b563" opacity=".55" />
      </svg>
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(15,10,5,.45) 0%, rgba(15,10,5,.05) 40%, rgba(15,10,5,.65) 100%)",
        }}
      />
      <div className="relative z-10 px-4 py-7">
        <h1 className="flex items-center justify-center gap-3 text-fluid-2xl font-extrabold text-white drop-shadow-lg">
          🚜 سامانه مدیریت مزرعه
        </h1>
        <p className="mt-2 text-fluid-xl font-bold text-white drop-shadow">«حسین‌آباد شهکل»</p>
        <p className="mt-1 flex items-center justify-center gap-2 text-fluid-sm text-sand-100/90 drop-shadow">
          📍 واقع در شهرستان ریگان
        </p>
      </div>
    </header>
  );
}
