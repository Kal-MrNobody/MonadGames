"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract, useSwitchChain } from "wagmi";
import { formatEther, formatUnits } from "viem";
import { api } from "@/lib/api";
import type { GameRecord } from "@/lib/types";
import { GameFrame } from "@/components/GameFrame";
import { GameCabinet } from "@/components/GameCabinet";
import { RewardToast, type ToastData } from "@/components/RewardToast";
import { EXPLORER, monadTestnet, shortAddr } from "@/lib/chain";
import { FACTORY_ADDRESS, gameFactoryAbi, gameTokenAbi } from "@/lib/contracts";

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const [game, setGame] = useState<GameRecord | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);
  const rewarding = useRef(false);

  useEffect(() => {
    api.game(id).then((r) => setGame(r.game)).catch((e) => setErr(e.message));
  }, [id]);

  const token = game?.tokenAddress;
  const fee = game?.playFeeWei ? BigInt(game.playFeeWei) : BigInt(0);
  const needsPay = !!token && !!FACTORY_ADDRESS && fee > BigInt(0) && !paid;

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: token,
    abi: gameTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: monadTestnet.id,
    query: { enabled: !!token && !!address },
  });

  const { writeContractAsync, data: payHash, isPending: paying } = useWriteContract();
  const { data: payReceipt, isLoading: payConfirming } = useWaitForTransactionReceipt({ hash: payHash, chainId: monadTestnet.id });
  useEffect(() => {
    if (payReceipt?.status === "success") setPaid(true);
  }, [payReceipt]);

  async function pay() {
    if (!token || !FACTORY_ADDRESS) return;
    if (!address) return setToast({ kind: "error", title: "Connect your wallet to play" });
    if (chainId !== monadTestnet.id) return switchChain({ chainId: monadTestnet.id });
    try {
      await writeContractAsync({
        address: FACTORY_ADDRESS,
        abi: gameFactoryAbi,
        functionName: "payToPlay",
        args: [token],
        value: fee,
        chainId: monadTestnet.id,
      });
    } catch (e) {
      setToast({ kind: "error", title: "Payment failed", body: (e as { shortMessage?: string }).shortMessage || (e as Error).message });
    }
  }

  const onGameOver = useCallback(
    async (final: number) => {
      setScore(final);
      setBest((b) => Math.max(b, final));
      if (!game || rewarding.current) return;
      api.play(game.id).catch(() => {});
      setGame((g) => (g ? { ...g, plays: g.plays + 1 } : g));
      if (!game.tokenAddress) {
        setToast({ kind: "info", title: `Game over — ${final} pts`, body: "This game has no token yet. Creators can launch one to reward players." });
        return;
      }
      if (!address) {
        setToast({ kind: "info", title: `Game over — ${final} pts`, body: `Connect a wallet to earn $${game.tokenSymbol} next time!` });
        return;
      }
      if (Math.floor(final) <= 0) return;
      rewarding.current = true;
      setToast({ kind: "info", title: "Sending your reward…", body: `${Math.min(Math.floor(final), 1000)} $${game.tokenSymbol} on the way` });
      try {
        const r = await api.reward(game.id, address, final);
        if (r.skipped || !r.txHash) setToast({ kind: "info", title: `Game over — ${final} pts`, body: "No reward this round." });
        else {
          setToast({ kind: "success", title: `+${r.amount} $${game.tokenSymbol} earned!`, body: `Score ${final}`, txHash: r.txHash });
          setTimeout(() => refetchBalance(), 1500);
          setTimeout(() => refetchBalance(), 6000);
        }
      } catch (e) {
        setToast({ kind: "error", title: "Reward failed", body: (e as Error).message });
      } finally {
        rewarding.current = false;
      }
    },
    [game, address, refetchBalance]
  );

  if (err)
    return (
      <div className="card mx-auto mt-10 max-w-md p-8 text-center">
        <div className="font-pixel text-xs text-pink">GAME OVER</div>
        <p className="mt-3 text-red-300">{err}</p>
        <Link href="/" className="btn-ghost mt-5">Back to arcade</Link>
      </div>
    );
  if (!game) return <div className="mx-auto mt-6 aspect-[9/16] max-h-[75vh] w-full max-w-md animate-pulse bg-panel" />;

  return (
    <div className="grid gap-6 pt-2 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div>
        <GameCabinet title={game.title} score={score} best={best} token={token ? game.tokenSymbol : undefined}>
          {needsPay ? (
            <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_40%,rgba(131,110,249,.35),transparent_65%)] p-6 text-center">
              <div>
                <div className="text-6xl">🪙</div>
                <div className="mt-4 font-pixel text-[11px] text-amber blink">INSERT COIN</div>
                <p className="mt-3 text-sm text-white/60">
                  {formatEther(fee)} MON per run · earn ${game.tokenSymbol} for every point
                </p>
                <button className="btn-primary mt-5" onClick={pay} disabled={paying || payConfirming}>
                  {paying ? "Confirm in wallet…" : payConfirming ? "Confirming…" : `Pay ${formatEther(fee)} MON`}
                </button>
                {payHash && (
                  <a className="mt-3 block font-mono text-xs text-cyan underline" href={EXPLORER.tx(payHash)} target="_blank" rel="noreferrer">
                    tx ↗
                  </a>
                )}
              </div>
            </div>
          ) : (
            <GameFrame html={game.html} title={game.title} onScore={setScore} onGameOver={onGameOver} />
          )}
        </GameCabinet>
      </div>

      <aside className="space-y-4">
        {token ? (
          <div className="card-neon p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="label">Game token</div>
                <div className="mt-1 font-display text-3xl font-black neon-cyan">${game.tokenSymbol}</div>
              </div>
              <span className="chip border-mint/60 text-mint">live</span>
            </div>
            <a className="font-mono text-xs text-white/50 hover:text-cyan" href={EXPLORER.address(token)} target="_blank" rel="noreferrer">
              {shortAddr(token)} ↗
            </a>
            <div className="mt-4 border border-line bg-black/50 p-3">
              <div className="label">Your balance</div>
              <div className="stat mt-1 text-xl font-bold text-white">
                {address ? (
                  balance !== undefined ? (
                    `${Number(formatUnits(balance, 18)).toLocaleString()} $${game.tokenSymbol}`
                  ) : (
                    "…"
                  )
                ) : (
                  <span className="text-sm text-white/50">Connect wallet to earn</span>
                )}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px] text-white/50">
              <div className="border border-line p-2"><div className="label">Rate</div><div className="mt-0.5 text-white">1 pt = 1 ${game.tokenSymbol}</div></div>
              <div className="border border-line p-2"><div className="label">Max / run</div><div className="mt-0.5 text-white">1,000</div></div>
            </div>
          </div>
        ) : (
          <div className="card p-4 text-sm text-white/55">
            <div className="label">Game token</div>
            <p className="mt-2">No token launched yet. Scores aren&apos;t rewarded until the creator launches one.</p>
            {address && game.creator?.toLowerCase() === address.toLowerCase() && (
              <Link className="btn-primary mt-3 w-full" href={`/create?remix=${game.id}`}>🚀 Launch token</Link>
            )}
          </div>
        )}

        <div className="card p-4">
          <div className="label">Made by</div>
          <div className="mt-1 font-mono text-sm">
            {game.creator ? (
              <a className="text-monad-light hover:text-cyan" href={EXPLORER.address(game.creator)} target="_blank" rel="noreferrer">
                {shortAddr(game.creator)} ↗
              </a>
            ) : (
              "anon"
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="chip border-monad/60 text-monad-light">{game.templateId}</span>
            <span className="chip border-pink/50 text-pink">▶ {game.plays} plays</span>
          </div>
          <p className="mt-3 line-clamp-3 font-mono text-xs text-white/45">&gt; {game.prompt}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              className="btn-ghost"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? "✓ Copied" : "🔗 Share"}
            </button>
            <Link className="btn-ghost" href={`/create?remix=${game.id}`}>🔁 Remix</Link>
          </div>
        </div>
      </aside>
      <RewardToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
