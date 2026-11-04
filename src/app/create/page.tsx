"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { api } from "@/lib/api";
import type { GameRecord } from "@/lib/types";
import { GameFrame } from "@/components/GameFrame";
import { GameCabinet } from "@/components/GameCabinet";
import { PromptConsole } from "@/components/PromptConsole";
import { LaunchTokenPanel } from "@/components/LaunchTokenPanel";

const BOOT = [
  "parsing prompt",
  "selecting game engine",
  "generating theme + palette",
  "tuning physics + difficulty",
  "minting vibes",
  "injecting score bridge",
  "booting cabinet",
];

function BootScreen() {
  const [n, setN] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setN((x) => Math.min(x + 1, BOOT.length)), 650);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="absolute inset-0 flex flex-col justify-end bg-black p-5 font-mono text-[12px] leading-relaxed text-mint">
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="floaty text-7xl opacity-90 drop-shadow-[0_0_30px_rgba(131,110,249,.9)]">🕹️</div>
      </div>
      <div className="relative">
        {BOOT.slice(0, n).map((l, i) => (
          <div key={l}>
            <span className="text-monad-light">[{String(i + 1).padStart(2, "0")}]</span> {l}
            {i < n - 1 ? <span className="text-cyan"> ··· ok</span> : <span className="blink text-pink"> █</span>}
          </div>
        ))}
        <div className="mt-3 h-1 w-full overflow-hidden bg-white/10">
          <div className="h-full bg-gradient-to-r from-cyan via-monad to-pink transition-all duration-500" style={{ width: `${(n / BOOT.length) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

function CreateInner() {
  const params = useSearchParams();
  const { address } = useAccount();
  const [prompt, setPrompt] = useState(params.get("prompt") || "");
  const [remixPrompt, setRemixPrompt] = useState("");
  const [game, setGame] = useState<GameRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const started = useRef(false);

  // ?remix=<id> loads an existing game as the base
  useEffect(() => {
    const remixId = params.get("remix");
    if (remixId) api.game(remixId).then((r) => setGame(r.game)).catch((e) => setErr(e.message));
  }, [params]);

  // auto-generate if arriving with ?prompt=
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (params.get("prompt") && !params.get("remix")) generate(params.get("prompt")!);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function generate(p = prompt) {
    if (!p.trim()) return;
    setPrompt(p);
    setLoading(true); setErr(null); setScore(0); setBest(0);
    try {
      const { game } = await api.generate(p.trim(), address);
      setGame(game);
    } catch (e) { setErr((e as Error).message); }
    finally { setLoading(false); }
  }

  async function remix() {
    if (!game || !remixPrompt.trim()) return;
    setLoading(true); setErr(null); setScore(0); setBest(0);
    try {
      const { game: g } = await api.remix(game.id, remixPrompt.trim());
      setGame(g); setRemixPrompt("");
    } catch (e) { setErr((e as Error).message); }
    finally { setLoading(false); }
  }

  const onOver = (s: number) => { setScore(s); setBest((b) => Math.max(b, s)); };

  return (
    <div className="grid gap-6 pt-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-5">
        <div>
          <div className="label text-cyan/80">{"// "}game forge</div>
          <h1 className="mt-1 font-display text-2xl font-black uppercase tracking-wide">Build a game</h1>
        </div>
        <PromptConsole value={prompt} onChange={setPrompt} onSubmit={(p) => generate(p)} busy={loading} cta={game ? "Regenerate" : "Generate"} />
        {err && <div className="card border-red-400/50 p-3 text-sm text-red-300">⚠ {err}</div>}

        <GameCabinet title={loading ? "Compiling…" : game?.title || "Insert idea"} score={game ? score : undefined} best={game ? best : undefined}
          token={game?.tokenAddress ? game.tokenSymbol : undefined}>
          {loading ? (
            <BootScreen />
          ) : game ? (
            <GameFrame key={game.id + game.html.length} html={game.html} title={game.title} onScore={setScore} onGameOver={onOver} />
          ) : (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div>
                <div className="text-6xl">👾</div>
                <div className="mt-5 font-pixel text-[11px] text-pink blink">INSERT IDEA</div>
                <p className="mt-3 text-sm text-white/45">Your game boots up on this screen.</p>
              </div>
            </div>
          )}
        </GameCabinet>
      </div>

      <aside className="space-y-4 lg:pt-[70px]">
        {game ? (
          <>
            <div className="card-neon p-4">
              <div className="label">Cartridge</div>
              <h2 className="mt-1 font-display text-xl font-black uppercase">{game.title}</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="chip border-monad/60 text-monad-light">{game.templateId}</span>
                {game.tokenSymbol && <span className="chip border-cyan/60 text-cyan">${game.tokenSymbol}</span>}
              </div>
              <p className="mt-3 line-clamp-3 font-mono text-xs text-white/45">&gt; {game.prompt}</p>
              <Link href={`/game/${game.id}`} className="btn-cyan mt-4 w-full">▶ Play full screen</Link>
            </div>
            <div className="card p-4">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider">🔁 Remix</h3>
              <p className="mt-1 text-xs text-white/45">Tweak it with words: faster, lava level, pink theme…</p>
              <input className="input mt-3" value={remixPrompt} onChange={(e) => setRemixPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && remix()} placeholder="make it harder + add lasers" />
              <button className="btn-ghost mt-2 w-full" onClick={remix} disabled={loading || !remixPrompt.trim()}>Remix this game</button>
            </div>
            <LaunchTokenPanel game={game} onLaunched={setGame} />
          </>
        ) : (
          <div className="card p-5 text-sm text-white/60">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">How it works</h3>
            <ol className="mt-3 space-y-3">
              {[
                ["01", "Describe any game idea"],
                ["02", "AI picks an engine and themes it"],
                ["03", "Launch your ERC20 on Monad"],
                ["04", "Players earn your token per point"],
              ].map(([n, t]) => (
                <li key={n} className="flex gap-3">
                  <span className="font-pixel text-[10px] leading-5 text-pink">{n}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </aside>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-mono text-white/50">loading…</div>}>
      <CreateInner />
    </Suspense>
  );
}
