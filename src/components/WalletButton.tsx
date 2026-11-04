"use client";
import { useEffect, useState } from "react";
import { useAccount, useBalance, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { formatEther } from "viem";
import { monadTestnet, shortAddr } from "@/lib/chain";

export function WalletButton() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { data: bal } = useBalance({ address, chainId: monadTestnet.id, query: { enabled: !!address, refetchInterval: 15000 } });
  const [open, setOpen] = useState(false);

  if (!mounted) return <button className="btn-ghost" disabled>Connect</button>;

  if (!isConnected || !address) {
    return (
      <div className="flex flex-col items-end">
        <button className="btn-primary" disabled={isPending}
          onClick={() => {
            const c = connectors[0];
            if (!c) return alert("No browser wallet found. Install MetaMask, Rabby or Phantom.");
            connect({ connector: c, chainId: monadTestnet.id });
          }}>
          {isPending ? "Connecting…" : "🔌 Connect"}
        </button>
        {error && <span className="mt-1 max-w-48 truncate text-[10px] text-red-300">{error.message.split("\n")[0]}</span>}
      </div>
    );
  }

  if (chainId !== monadTestnet.id) {
    return (
      <button className="btn bg-amber-500/90 text-black hover:bg-amber-400" disabled={switching}
        onClick={() => switchChain({ chainId: monadTestnet.id })}>
        {switching ? "Switching…" : "⚠️ Switch to Monad"}
      </button>
    );
  }

  return (
    <div className="relative">
      <button className="btn-ghost" onClick={() => setOpen((o) => !o)}>
        <span className="hidden text-monad-light sm:inline">
          {bal ? `${Number(formatEther(bal.value)).toFixed(3)} MON` : "…"}
        </span>
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        {shortAddr(address)}
      </button>
      {open && (
        <div className="card slidein absolute right-0 mt-2 w-56 p-3 text-sm">
          <div className="text-white/50">Balance</div>
          <div className="mb-3 font-semibold">{bal ? `${Number(formatEther(bal.value)).toFixed(4)} MON` : "…"}</div>
          <button className="btn-ghost mb-2 w-full" onClick={() => { navigator.clipboard?.writeText(address); setOpen(false); }}>📋 Copy address</button>
          <button className="btn-ghost w-full" onClick={() => { disconnect(); setOpen(false); }}>Disconnect</button>
        </div>
      )}
    </div>
  );
}
