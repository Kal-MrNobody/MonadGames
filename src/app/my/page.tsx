"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAccount, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { api, type GameSummary } from "@/lib/api";
import { GameCard } from "@/components/GameCard";
import { WalletButton } from "@/components/WalletButton";
import { EXPLORER, monadTestnet, shortAddr } from "@/lib/chain";
import { gameTokenAbi } from "@/lib/contracts";

export default function MyGames() {
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [games, setGames] = useState<GameSummary[] | null>(null);
  useEffect(() => setMounted(true), []);
  useEffect(() => { api.games().then((r) => setGames(r.games)).catch(() => setGames([])); }, []);

  const mine = useMemo(
    () => (games && address ? games.filter((g) => g.creator?.toLowerCase() === address.toLowerCase()) : []),
    [games, address]
  );
  const tokenGames = useMemo(() => (games ?? []).filter((g) => g.tokenAddress), [games]);

  const { data: balances } = useReadContracts({
    contracts: tokenGames.map((g) => ({
      address: g.tokenAddress!, abi: gameTokenAbi, functionName: "balanceOf" as const, args: [address!] as const, chainId: monadTestnet.id,
    })),
    query: { enabled: !!address && tokenGames.length > 0 },
  });

  if (!mounted) return null;
  if (!address) {
    return (
      <div className="card mx-auto mt-12 max-w-md p-8 text-center">
        <div className="text-5xl">👛</div>
        <div className="mt-4 font-pixel text-[10px] text-pink blink">PLAYER 1</div>
        <h1 className="mt-3 font-display text-xl font-black uppercase">Connect to open your vault</h1>
        <p className="mt-1 text-sm text-white/50">Games you create and tokens you earn show up here.</p>
        <div className="mt-5 flex justify-center"><WalletButton /></div>
      </div>
    );
  }

  const held = tokenGames
    .map((g, i) => ({ g, bal: balances?.[i]?.status === "success" ? (balances[i].result as bigint) : BigInt(0) }))
    .filter((x) => x.bal > BigInt(0) || x.g.creator?.toLowerCase() === address.toLowerCase());

  return (
    <div className="space-y-10 pt-4">
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="label text-cyan/80">{"// "}vault</div>
            <h1 className="mt-1 font-display text-2xl font-black uppercase tracking-wide">My games</h1>
          </div>
          <Link href="/create" className="btn-primary">✨ New game</Link>
        </div>
        {games === null ? (
          <div className="card h-40 animate-pulse" />
        ) : mine.length === 0 ? (
          <div className="card p-8 text-center text-white/60">You haven&apos;t created a game yet. <Link className="text-monad-light underline" href="/create">Make one</Link></div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{mine.map((g) => <GameCard key={g.id} game={g} />)}</div>
        )}
      </section>

      <section>
        <div className="label mb-1 text-cyan/80">{"// "}inventory</div>
        <h2 className="mb-3 font-display text-xl font-black uppercase tracking-wide">Game tokens</h2>
        {held.length === 0 ? (
          <div className="card p-6 text-sm text-white/50">No game tokens yet — play a game with a token to start earning.</div>
        ) : (
          <div className="card divide-y divide-line">
            {held.map(({ g, bal }) => (
              <div key={g.id} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/game/${g.id}`} className="font-display font-bold text-cyan hover:underline">${g.tokenSymbol}</Link>
                  <div className="truncate text-xs text-white/50">{g.title} · <a className="underline" href={EXPLORER.address(g.tokenAddress!)} target="_blank" rel="noreferrer">{shortAddr(g.tokenAddress)}</a></div>
                </div>
                <div className="stat text-right text-base font-bold text-mint">{Number(formatUnits(bal, 18)).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
