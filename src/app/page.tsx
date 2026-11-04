"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type GameSummary, type TemplateInfo } from "@/lib/api";
import { GameCard } from "@/components/GameCard";

const EXAMPLES = [
  "Flappy bird but it's a purple Monad cat dodging gas fees",
  "Snake that eats MON coins in a neon cyberpunk city",
  "Endless runner where a frog jumps over rug pulls",
  "Tap as fast as you can to mine blocks",
  "Dodge falling meteors in space with a tiny rocket",
];

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [games, setGames] = useState<GameSummary[] | null>(null);
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);

  useEffect(() => {
    api.games().then((r) => setGames(r.games)).catch(() => setGames([]));
    api.templates().then((r) => setTemplates(r.templates)).catch(() => {});
  }, []);

  const icons = Object.fromEntries(templates.map((t) => [t.id, t.icon]));
  const go = (p: string) => p.trim() && router.push(`/create?prompt=${encodeURIComponent(p.trim())}`);

  return (
    <div className="space-y-12">
      <section className="pt-8 text-center sm:pt-16">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-monad/40 bg-monad/10 px-3 py-1 text-xs text-monad-light">
          ⚡ Live on Monad Testnet
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
          <span className="gradient-text">Type an idea. Get an onchain game. Own the token.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-white/60">
          AI spins up a playable mini-game in seconds. Launch its ERC20 on Monad, and players earn your token for every point.
        </p>
        <form onSubmit={(e) => { e.preventDefault(); go(prompt); }} className="card glow mx-auto mt-8 max-w-2xl p-2 text-left">
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); go(prompt); } }}
            placeholder="A game where a purple ghost collects gems while dodging bats…"
            className="w-full resize-none bg-transparent p-3 text-base outline-none placeholder:text-white/30" />
          <div className="flex items-center justify-between p-1">
            <span className="text-xs text-white/40">Enter ↵ to generate</span>
            <button className="btn-primary" disabled={!prompt.trim()}>✨ Generate game</button>
          </div>
        </form>
        <div className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2">
          {EXAMPLES.map((ex) => (
            <button key={ex} onClick={() => go(ex)} className="rounded-full border border-line bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:border-monad hover:text-white">
              {ex}
            </button>
          ))}
        </div>
      </section>

      {templates.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">Start from a template</h2>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {templates.map((t) => (
              <button key={t.id} onClick={() => go(`${t.name}: ${t.description}`)}
                className="card min-w-40 shrink-0 p-3 text-left hover:border-monad/60">
                <div className="text-3xl">{t.icon}</div>
                <div className="mt-2 font-semibold">{t.name}</div>
                <div className="line-clamp-2 text-xs text-white/50">{t.description}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-xl font-bold">🔥 Fresh games</h2>
          {games && <span className="text-xs text-white/40">{games.length} games</span>}
        </div>
        {games === null ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="card aspect-[4/4] animate-pulse" />)}
          </div>
        ) : games.length === 0 ? (
          <div className="card p-8 text-center text-white/60">No games yet — be the first to create one! 🚀</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[...games].sort((a, b) => b.createdAt - a.createdAt).map((g) => <GameCard key={g.id} game={g} icon={icons[g.templateId]} />)}
          </div>
        )}
      </section>
    </div>
  );
}
