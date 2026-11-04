"use client";

/** Arcade cabinet: neon marquee, CRT screen, LED score panel. Children render on the screen. */
export function GameCabinet({
  title,
  score,
  best,
  token,
  children,
}: {
  title: string;
  score?: number;
  best?: number;
  token?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md">
      {/* marquee */}
      <div className="relative mb-2 overflow-hidden border border-monad/50 bg-gradient-to-r from-deep via-[#2a0a52] to-berry/70 px-4 py-2 text-center shadow-[0_0_30px_-6px_rgba(131,110,249,.8)]"
        style={{ clipPath: "polygon(12px 0, calc(100% - 12px) 0, 100% 100%, 0 100%)" }}>
        <div className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent scanbar" />
        <div className="truncate font-display text-sm font-black uppercase tracking-[.2em] text-white neon-text">{title}</div>
      </div>
      {/* screen */}
      <div className="cabinet">
        <div className="relative aspect-[9/16] max-h-[70vh] w-full overflow-hidden bg-black">{children}</div>
      </div>
      {/* control panel */}
      {(score !== undefined || best !== undefined || token) && (
        <div className="mt-2 grid grid-cols-3 gap-px border border-monad/40 bg-monad/40">
          <Led label="Score" value={score ?? 0} tone="text-cyan" />
          <Led label="Best" value={best ?? 0} tone="text-pink" />
          <Led label="Payout" value={token ? `$${token}` : "—"} tone="text-mint" />
        </div>
      )}
    </div>
  );
}

function Led({ label, value, tone }: { label: string; value: number | string; tone: string }) {
  return (
    <div className="bg-ink px-2 py-2 text-center">
      <div className="label">{label}</div>
      <div className={`stat mt-0.5 truncate text-lg font-bold ${tone}`} style={{ textShadow: "0 0 10px currentColor" }}>
        {typeof value === "number" ? value.toString().padStart(5, "0") : value}
      </div>
    </div>
  );
}
