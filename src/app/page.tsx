"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useReadContract } from "wagmi";
import { api, type GameSummary, type TemplateInfo } from "@/lib/api";
import { GameCard } from "@/components/GameCard";
import { PromptConsole } from "@/components/PromptConsole";
import { FACTORY_ADDRESS, gameFactoryAbi } from "@/lib/contracts";
import { monadTestnet } from "@/lib/chain";

const EXAMPLES = [
  "Flappy bird but a purple Monad cat dodging gas fees",
  "Snake that eats MON coins in a neon cyberpunk city",
  "Runner where a frog jumps over rug pulls",
  "Shoot down MEV bots raiding the mempool",
  "Catch falling blocks at 10,000 TPS",
];

const STEPS = [
  { n: "01", icon: "⌨️", title: "Prompt", body: "Type any idea, however weird. AI picks the mechanic and themes the game in seconds." },
  { n: "02", icon: "🪙", title: "Launch", body: "Mint the game's own ERC20 on Monad in one tx. Set an optional pay-to-play fee in MON." },
  { n: "03", icon: "🏆", title: "Earn", body: "Players earn your token for every point. Creators take 90% of every play fee." },
];

export default function Home() {
  const router = useRouter();
  const [games, setGames] = useState<GameSummary[] | null>(null);
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const { data: onchainCount } = useReadContract({
    address: FACTORY_ADDRESS, abi: gameFactoryAbi, functionName: "gamesCount", chainId: monadTestnet.id,
    query: { enabled: !!FACTORY_ADDRESS, refetchInterval: 15000 },
  });

  useEffect(() => {
    api.games().then((r) => setGames(r.games)).catch(() => setGames([]));
    api.templates().then((r) => setTemplates(r.templates)).catch(() => {});
  }, []);

  const icons = Object.fromEntries(templates.map((t) => [t.id, t.icon]));
  const go = (p: string) => p.trim() && router.push(`/create?prompt=${encodeURIComponent(p.trim())}`);
  const sorted = useMemo(() => [...(games ?? [])].sort((a, b) => b.createdAt - a.createdAt), [games]);
  const plays = (games ?? []).reduce((s, g) => s + (g.plays || 0), 0);
  const tokenGames = (games ?? []).filter((g) => g.tokenAddress);

  const stats = [
    { k: "Games built", v: games ? games.length : "—" },
    { k: "Tokens onchain", v: onchainCount !== undefined ? onchainCount.toString() : tokenGames.length || "—" },
    { k: "Total plays", v: games ? plays.toLocaleString() : "—" },
    { k: "Game engines", v: templates.length || 10 },
  ];

  return (
    <div className="space-y-16">
      {/* ── HERO ── */}
      <section className="relative -mx-4 overflow-hidden px-4 pb-14 pt-10 sm:pt-16">
        <div className="synth-floor" aria-hidden />
        <div className="pointer-events-none absolute left-1/2 top-24 h-64 w-64 -translate-x-1/2 rounded-full bg-monad/30 blur-[100px]" aria-hidden />
        <div className="relative text-center">
          <div className="mb-6 inline-flex items-center gap-2 border border-mint/40 bg-mint/[.06] px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[.25em] text-mint">
            <span className="h-1.5 w-1.5 rounded-full bg-mint shadow-[0_0_8px_var(--color-mint)]" /> Live on Monad testnet
          </div>
          <h1 className="mx-auto max-w-4xl font-display text-[34px] font-black uppercase leading-[1.05] tracking-tight sm:text-6xl">
            <span className="glitch block text-white" data-text="Type an idea.">Type an idea.</span>
            <span className="gradient-text block">Play it onchain.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/60 sm:text-lg">
            AI turns your prompt into a playable arcade game with its own token on Monad. Players earn <span className="neon-cyan">$TOKENS</span> for every point.
          </p>

          <div className="mx-auto mt-8 max-w-2xl text-left">
            <PromptConsole onSubmit={go} autoFocus />
          </div>

          <div className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => go(ex)}
                className="border border-line bg-black/40 px-3 py-1.5 text-xs text-white/65 transition hover:border-pink/70 hover:text-pink">
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* stats strip */}
        <div className="relative mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-px overflow-hidden border border-monad/30 bg-monad/30 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.k} className="bg-ink/90 px-4 py-3 text-center">
              <div className="stat text-2xl font-bold text-white neon-text">{s.v}</div>
              <div className="label mt-1">{s.k}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TICKER ── */}
      {sorted.length > 0 && (
        <div className="-mx-4 overflow-hidden border-y border-monad/25 bg-black/50 py-2">
          <div className="marquee flex w-max gap-8 whitespace-nowrap font-pixel text-[10px] text-white/70">
            {[...sorted, ...sorted].map((g, i) => (
              <Link key={g.id + i} href={`/game/${g.id}`} className="hover:text-cyan">
                <span className="text-pink">▶</span> {g.title.toUpperCase()}
                {g.tokenSymbol && <span className="ml-2 text-cyan">${g.tokenSymbol}</span>}
                <span className="ml-2 text-white/35">{g.plays ?? 0} PLAYS</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── HOW IT WORKS ── */}
      <section>
        <SectionTitle kicker="How it works" title="Prompt → Launch → Earn" />
        <div className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="card p-5">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{s.icon}</span>
                <span className="font-pixel text-[10px] text-monad-light/60">{s.n}</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-bold uppercase tracking-wider">{s.title}</h3>
              <p className="mt-1 text-sm text-white/55">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── NOW PLAYING ── */}
      <section>
        <SectionTitle kicker="Now playing" title="The arcade floor" right={games ? `${games.length} cabinets` : undefined} />
        {games === null ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="card aspect-[4/5] animate-pulse" />)}
          </div>
        ) : games.length === 0 ? (
          <div className="card p-10 text-center text-white/60">
            <div className="font-pixel text-xs text-pink blink">INSERT IDEA</div>
            <p className="mt-3">No games yet. Be the first to build one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {sorted.map((g) => <GameCard key={g.id} game={g} icon={icons[g.templateId]} />)}
          </div>
        )}
      </section>

      {/* ── ENGINES ── */}
      {templates.length > 0 && (
        <section>
          <SectionTitle kicker="Pick a cabinet" title="10 game engines" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {templates.map((t) => (
              <button key={t.id} onClick={() => go(`${t.name}: ${t.description}`)}
                className="card group p-3 text-left transition hover:border-cyan/60">
                <div className="text-3xl transition group-hover:scale-110">{t.icon}</div>
                <div className="mt-2 font-display text-xs font-bold uppercase tracking-wider group-hover:text-cyan">{t.name}</div>
                <div className="mt-0.5 line-clamp-2 text-[11px] text-white/45">{t.description}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="card-neon relative overflow-hidden p-8 text-center sm:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-pink/25 blur-[80px]" aria-hidden />
        <div className="font-pixel text-[11px] text-cyan blink">PRESS START</div>
        <h2 className="mt-4 font-display text-2xl font-black uppercase sm:text-4xl">Your game. Your token. <span className="neon-pink">Your players.</span></h2>
        <Link href="/create" className="btn-primary mt-6">⚡ Build a game</Link>
      </section>
    </div>
  );
}

function SectionTitle({ kicker, title, right }: { kicker: string; title: string; right?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <div className="label text-cyan/80">{"// "}{kicker}</div>
        <h2 className="mt-1 font-display text-xl font-black uppercase tracking-wide sm:text-2xl">{title}</h2>
      </div>
      {right && <span className="stat text-xs text-white/40">{right}</span>}
    </div>
  );
}
