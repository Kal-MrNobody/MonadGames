"use client";
import Link from "next/link";
import type { GameSummary } from "@/lib/api";
import { TEMPLATE_ICONS } from "@/lib/api";

export function GameCard({ game, icon }: { game: GameSummary; icon?: string }) {
  const emoji = icon || TEMPLATE_ICONS[game.templateId] || "🎮";
  const color = typeof game.config?.primaryColor === "string" ? (game.config.primaryColor as string) : "#836EF9";
  return (
    <Link href={`/game/${game.id}`} className="card group block overflow-hidden transition hover:-translate-y-0.5 hover:border-monad/60">
      <div className="relative grid aspect-[4/3] place-items-center"
        style={{ background: `radial-gradient(circle at 50% 40%, ${color}55, transparent 70%), #0f0c1a` }}>
        <span className="text-6xl transition group-hover:scale-110">{emoji}</span>
        {game.tokenSymbol && game.tokenAddress && (
          <span className="absolute right-2 top-2 rounded-full bg-monad px-2 py-0.5 text-xs font-bold">${game.tokenSymbol}</span>
        )}
        {game.playFeeWei && game.playFeeWei !== "0" && (
          <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs">💰 paid</span>
        )}
      </div>
      <div className="p-3">
        <div className="truncate font-semibold">{game.title}</div>
        <div className="mt-1 flex items-center justify-between text-xs text-white/50">
          <span className="truncate">{game.templateId}</span>
          <span>▶ {game.plays ?? 0}</span>
        </div>
      </div>
    </Link>
  );
}
