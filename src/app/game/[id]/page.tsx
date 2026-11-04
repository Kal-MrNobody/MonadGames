"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract, useSwitchChain } from "wagmi";
import { formatEther, formatUnits } from "viem";
import { api } from "@/lib/api";
import type { GameRecord } from "@/lib/types";
import { GameFrame } from "@/components/GameFrame";
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

  if (err) return <div className="card mt-8 p-6 text-center text-red-300">⚠️ {err}</div>;
  if (!game) return <div className="mx-auto mt-6 aspect-[9/16] max-h-[75vh] w-full max-w-md animate-pulse rounded-2xl bg-panel" />;

  return (
    <div className="grid gap-6 pt-2 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div>
        <div className="mx-auto mb-2 flex max-w-md items-center justify-between gap-2">
          <h1 className="truncate text-lg font-bold">{game.title}</h1>
          <div className="flex shrink-0 gap-2 text-sm">
            <span className="rounded-lg bg-white/5 px-2 py-1">Score <b className="text-monad-light">{score}</b></span>
            <span className="rounded-lg bg-white/5 px-2 py-1">Best <b>{best}</b></span>
          </div>
        </div>
        <div className="mx-auto aspect-[9/16] max-h-[75vh] w-full max-w-md">
          {needsPay ? (
            <div className="card glow grid h-full place-items-center p-6 text-center">
              <div>
                <div className="text-6xl">🎟️</div>
                <h2 className="mt-3 text-xl font-bold">Pay to play</h2>
                <p className="mt-1 text-white/60">
                  {formatEther(fee)} MON per session · earn ${game.tokenSymbol} for every point
                </p>
                <button className="btn-primary mt-5" onClick={pay} disabled={paying || payConfirming}>
                  {paying ? "Confirm in wallet…" : payConfirming ? "Confirming…" : `Pay ${formatEther(fee)} MON & play`}
                </button>
                {payHash && (
                  <a className="mt-2 block text-xs text-monad-light underline" href={EXPLORER.tx(payHash)} target="_blank" rel="noreferrer">
                    Tx ↗
                  </a>
                )}
              </div>
            </div>
          ) : (
            <GameFrame html={game.html} title={game.title} onScore={setScore} onGameOver={onGameOver} />
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="card p-4">
          <div className="text-xs text-white/40">Made by</div>
          <div className="font-mono text-sm">
            {game.creator ? (
              <a className="underline" href={EXPLORER.address(game.creator)} target="_blank" rel="noreferrer">
                {shortAddr(game.creator)}
              </a>
            ) : (
              "anon"
            )}
          </div>
          <div className="mt-2 text-sm text-white/50">▶ {game.plays} plays · {game.templateId}</div>
          <p className="mt-2 line-clamp-3 text-sm italic text-white/50">“{game.prompt}”</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              className="btn-ghost"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? "✅ Copied" : "🔗 Share"}
            </button>
            <Link className="btn-ghost" href={`/create?remix=${game.id}`}>🔁 Remix</Link>
          </div>
        </div>
        {token ? (
          <div className="card p-4">
            <div className="text-xs text-white/40">Game token</div>
            <div className="text-2xl font-black text-monad-light">${game.tokenSymbol}</div>
            <a className="text-xs text-white/60 underline" href={EXPLORER.address(token)} target="_blank" rel="noreferrer">
              {shortAddr(token)} ↗
            </a>
            <div className="mt-3 rounded-xl bg-black/30 p-3">
              <div className="text-xs text-white/40">Your balance</div>
              <div className="text-lg font-bold">
                {address
                  ? balance !== undefined
                    ? `${Number(formatUnits(balance, 18)).toLocaleString()} $${game.tokenSymbol}`
                    : "…"
                  : "Connect wallet"}
              </div>
            </div>
            <p className="mt-2 text-xs text-white/40">1 point = 1 ${game.tokenSymbol} (max 1000 per game).</p>
          </div>
        ) : (
          <div className="card p-4 text-sm text-white/50">
            No token launched yet.{" "}
            {address && game.creator?.toLowerCase() === address.toLowerCase() && (
              <Link className="text-monad-light underline" href={`/create?remix=${game.id}`}>Launch one</Link>
            )}
          </div>
        )}
      </aside>
      <RewardToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
