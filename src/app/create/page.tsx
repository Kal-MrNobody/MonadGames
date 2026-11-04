"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { api } from "@/lib/api";
import type { GameRecord } from "@/lib/types";
import { GameFrame } from "@/components/GameFrame";
import { LaunchTokenPanel } from "@/components/LaunchTokenPanel";

const LOADING = ["🧠 Dreaming up mechanics…", "🎨 Painting pixels…", "⚙️ Wiring the physics…", "🪙 Minting vibes…", "🚀 Almost ready…"];

function CreateInner() {
  const params = useSearchParams();
  const { address } = useAccount();
  const [prompt, setPrompt] = useState(params.get("prompt") || "");
  const [remixPrompt, setRemixPrompt] = useState("");
  const [game, setGame] = useState<GameRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setStep((s) => (s + 1) % LOADING.length), 1400);
    return () => clearInterval(t);
  }, [loading]);

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
    setLoading(true); setErr(null); setStep(0); setScore(0);
    try {
      const { game } = await api.generate(p.trim(), address);
      setGame(game);
    } catch (e) { setErr((e as Error).message); }
    finally { setLoading(false); }
  }

  async function remix() {
    if (!game || !remixPrompt.trim()) return;
    setLoading(true); setErr(null); setStep(0); setScore(0);
    try {
      const { game: g } = await api.remix(game.id, remixPrompt.trim());
      setGame(g); setRemixPrompt("");
    } catch (e) { setErr((e as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid gap-6 pt-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <div className="card p-3">
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
            placeholder="Describe your game idea…" className="w-full resize-none bg-transparent p-2 outline-none placeholder:text-white/30" />
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => generate()} disabled={loading || !prompt.trim()}>
              {loading ? "Generating…" : game ? "✨ Generate new" : "✨ Generate"}
            </button>
          </div>
        </div>
        {err && <div className="card border-red-400/40 p-3 text-sm text-red-300">⚠️ {err}</div>}

        <div className="mx-auto aspect-[9/16] max-h-[75vh] w-full max-w-md">
          {loading ? (
            <div className="card glow grid h-full place-items-center p-6 text-center">
              <div>
                <div className="floaty text-6xl">🎮</div>
                <div className="mt-4 text-lg font-semibold">{LOADING[step]}</div>
                <div className="mx-auto mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-1/2 animate-pulse rounded-full bg-monad" />
                </div>
              </div>
            </div>
          ) : game ? (
            <GameFrame key={game.id + game.html.length} html={game.html} title={game.title} onScore={setScore} onGameOver={setScore} />
          ) : (
            <div className="card grid h-full place-items-center p-6 text-center text-white/50">
              <div><div className="text-5xl">🕹️</div><p className="mt-3">Your game preview appears here</p></div>
            </div>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        {game ? (
          <>
            <div className="card p-4">
              <div className="text-xs text-white/40">Preview</div>
              <h2 className="text-xl font-bold">{game.title}</h2>
              <div className="mt-1 text-sm text-white/50">Template: {game.templateId} · Score: <span className="text-monad-light">{score}</span></div>
              <Link href={`/game/${game.id}`} className="btn-primary mt-3 w-full">▶ Play full screen</Link>
            </div>
            <div className="card p-4">
              <h3 className="mb-2 font-semibold">🔁 Remix</h3>
              <input className="input" value={remixPrompt} onChange={(e) => setRemixPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && remix()} placeholder="Make it faster, add lava, pink theme…" />
              <button className="btn-ghost mt-2 w-full" onClick={remix} disabled={loading || !remixPrompt.trim()}>Remix this game</button>
            </div>
            <LaunchTokenPanel game={game} onLaunched={setGame} />
          </>
        ) : (
          <div className="card p-4 text-sm text-white/60">
            <h3 className="mb-2 font-semibold text-white">How it works</h3>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Describe a game idea</li>
              <li>AI builds a playable mini-game</li>
              <li>Launch your own ERC20 token on Monad</li>
              <li>Players earn your token for every point</li>
            </ol>
          </div>
        )}
      </aside>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-white/50">Loading…</div>}>
      <CreateInner />
    </Suspense>
  );
}
