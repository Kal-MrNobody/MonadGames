"use client";
import Link from "next/link";
import type { GameSummary } from "@/lib/api";
import { TEMPLATE_ICONS } from "@/lib/api";

function hex(c: unknown, fallback: string) {
  return typeof c === "string" && /^#[0-9a-fA-F]{6}$/.test(c) ? c : fallback;
}

/** Arcade-cabinet tile: CRT "screen" tinted with the game's own colours. */
export function GameCard({ game, icon }: { game: GameSummary; icon?: string }) {
  const cfg = game.config ?? {};
  const emoji = (typeof cfg.playerEmoji === "string" && cfg.playerEmoji) || icon || TEMPLATE_ICONS[game.templateId] || "🎮";
  const p = hex(cfg.primaryColor, "#836EF9");
  const a = hex(cfg.accentColor, "#2EF2FF");
  const bg = hex(cfg.backgroundColor, "#0E0B1A");
  const paid = game.playFeeWei && game.playFeeWei !== "0";

  return (
    <Link href={`/game/${game.id}`} className="card group block transition duration-200 hover:-translate-y-1 hover:border-monad">
      <div className="relative m-2 mb-0 aspect-[4/3] overflow-hidden border border-black"
        style={{ background: `radial-gradient(circle at 50% 45%, ${p}66, transparent 65%), linear-gradient(180deg, ${bg}, #000)` }}>
        {/* mini grid floor */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-60"
          style={{
            backgroundImage: `linear-gradient(${a}55 1px, transparent 1px), linear-gradient(90deg, ${a}55 1px, transparent 1px)`,
            backgroundSize: "18px 18px", transform: "perspective(120px) rotateX(55deg)", transformOrigin: "bottom",
          }} />
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-5xl drop-shadow-[0_0_14px_rgba(255,255,255,.35)] transition duration-300 group-hover:scale-125 sm:text-6xl">{emoji}</span>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(0,0,0,.25)_0_1px,transparent_1px_3px)]" />
        <div className="absolute inset-0 grid place-items-center bg-black/60 opacity-0 transition group-hover:opacity-100">
          <span className="font-pixel text-[10px] text-cyan blink">PRESS START</span>
        </div>
        {game.tokenAddress && game.tokenSymbol && (
          <span className="chip absolute right-1.5 top-1.5 border-cyan/60 bg-black/70 text-cyan">${game.tokenSymbol}</span>
        )}
        {paid && <span className="chip absolute left-1.5 top-1.5 border-amber/60 bg-black/70 text-amber">MON</span>}
      </div>
      <div className="p-3 pt-2.5">
        <div className="truncate font-display text-[13px] font-bold uppercase tracking-wide group-hover:text-cyan">{game.title}</div>
        <div className="mt-1 flex items-center justify-between font-mono text-[11px] text-white/45">
          <span className="truncate uppercase">{game.templateId}</span>
          <span><span className="text-pink">▶</span> {game.plays ?? 0}</span>
        </div>
      </div>
    </Link>
  );
}
