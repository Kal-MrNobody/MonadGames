"use client";
import { useEffect, useState } from "react";
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract, useSwitchChain } from "wagmi";
import { parseEther, parseEventLogs, zeroAddress, formatEther } from "viem";
import type { GameRecord } from "@/lib/types";
import { FACTORY_ADDRESS, FACTORY_MISSING_MSG, gameFactoryAbi } from "@/lib/contracts";
import { EXPLORER, monadTestnet, shortAddr } from "@/lib/chain";
import { api } from "@/lib/api";

function defaultSymbol(game: GameRecord) {
  const s = game.config?.tokenSymbol;
  if (typeof s === "string" && s) return s.toUpperCase().slice(0, 8);
  return game.title.replace(/[^a-zA-Z]/g, "").slice(0, 5).toUpperCase() || "GAME";
}

export function LaunchTokenPanel({ game, onLaunched }: { game: GameRecord; onLaunched?: (g: GameRecord) => void }) {
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const client = usePublicClient({ chainId: monadTestnet.id });
  const [name, setName] = useState(game.title);
  const [symbol, setSymbol] = useState(defaultSymbol(game));
  const [fee, setFee] = useState("0");
  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { writeContractAsync, data: hash, isPending, reset } = useWriteContract();
  const { data: receipt, isLoading: confirming } = useWaitForTransactionReceipt({ hash, chainId: monadTestnet.id });

  useEffect(() => { setName(game.title); setSymbol(defaultSymbol(game)); reset(); setErr(null); setStatus(null); }, [game.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!receipt || !address) return;
    (async () => {
      try {
        setStatus("Indexing your token…");
        let token: `0x${string}` | undefined;
        const logs = parseEventLogs({ abi: gameFactoryAbi, logs: receipt.logs, eventName: "GameCreated" });
        token = logs.find((l) => l.args.gameId === game.id)?.args.token ?? logs[0]?.args.token;
        if ((!token || token === zeroAddress) && client && FACTORY_ADDRESS) {
          token = await client.readContract({ address: FACTORY_ADDRESS, abi: gameFactoryAbi, functionName: "tokenByGameId", args: [game.id] });
        }
        if (!token || token === zeroAddress) throw new Error("Could not find the token address in the receipt");
        let feeWei = "0";
        try { feeWei = parseEther(fee || "0").toString(); } catch {}
        const { game: updated } = await api.patch(game.id, { tokenAddress: token, tokenSymbol: symbol, creator: address, playFeeWei: feeWei });
        setStatus(null);
        onLaunched?.(updated);
      } catch (e) {
        setErr((e as Error).message); setStatus(null);
      }
    })();
  }, [receipt]); // eslint-disable-line react-hooks/exhaustive-deps

  if (game.tokenAddress) {
    return (
      <div className="card p-4">
        <div className="text-sm text-white/50">Token live 🚀</div>
        <div className="mt-1 text-xl font-bold text-monad-light">${game.tokenSymbol}</div>
        <a className="text-sm text-white/70 underline" href={EXPLORER.address(game.tokenAddress)} target="_blank" rel="noreferrer">
          {shortAddr(game.tokenAddress)} ↗
        </a>
        <div className="mt-1 text-xs text-white/50">
          Play fee: {game.playFeeWei && game.playFeeWei !== "0" ? `${formatEther(BigInt(game.playFeeWei))} MON` : "free"}
        </div>
        {hash && <a className="mt-1 block text-xs text-monad-light underline" href={EXPLORER.tx(hash)} target="_blank" rel="noreferrer">Launch tx ↗</a>}
      </div>
    );
  }

  async function launch() {
    setErr(null);
    if (!FACTORY_ADDRESS) return setErr(FACTORY_MISSING_MSG);
    if (!address) return setErr("Connect your wallet first");
    if (chainId !== monadTestnet.id) { switchChain({ chainId: monadTestnet.id }); return; }
    if (!name.trim() || !symbol.trim()) return setErr("Name and symbol are required");
    let feeWei: bigint;
    try { feeWei = parseEther(fee || "0"); } catch { return setErr("Invalid fee"); }
    try {
      await writeContractAsync({
        address: FACTORY_ADDRESS, abi: gameFactoryAbi, functionName: "createGame",
        args: [name.trim(), symbol.trim().toUpperCase(), game.id, feeWei], chainId: monadTestnet.id,
      });
    } catch (e) {
      setErr((e as { shortMessage?: string }).shortMessage || (e as Error).message);
    }
  }

  const busy = isPending || confirming || !!status;
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">🪙 Launch your game token</h3>
        <span className="text-xs text-white/40">ERC20 on Monad</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Token name" maxLength={40} />
        <input className="input uppercase" value={symbol} onChange={(e) => setSymbol(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10))} placeholder="SYMBOL" />
      </div>
      <label className="mt-2 block text-xs text-white/50">Pay-to-play fee (MON, 0 = free)</label>
      <input className="input mt-1" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0" />
      <button className="btn-primary mt-3 w-full" onClick={launch} disabled={busy || !FACTORY_ADDRESS}>
        {isPending ? "Confirm in wallet…" : confirming ? "Launching onchain…" : status ? status : "🚀 Launch token"}
      </button>
      {!FACTORY_ADDRESS && <p className="mt-2 text-xs text-amber-300">{FACTORY_MISSING_MSG}</p>}
      {hash && <a className="mt-2 block text-xs text-monad-light underline" href={EXPLORER.tx(hash)} target="_blank" rel="noreferrer">Tx {shortAddr(hash)} ↗</a>}
      {err && <p className="mt-2 break-words text-xs text-red-300">{err}</p>}
      <p className="mt-2 text-xs text-white/40">Players earn ${symbol || "TOKEN"} for every point they score.</p>
    </div>
  );
}
