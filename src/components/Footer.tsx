"use client";
import { useBlockNumber } from "wagmi";
import { EXPLORER, monadTestnet, shortAddr } from "@/lib/chain";
import { FACTORY_ADDRESS } from "@/lib/contracts";
import { Logo } from "./Navbar";

export function Footer() {
  const { data: block } = useBlockNumber({ chainId: monadTestnet.id, watch: true, query: { refetchInterval: 4000 } });
  return (
    <footer className="border-t border-monad/20 bg-black/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Logo small />
          <span>The onchain arcade. Built on Monad.</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-mint shadow-[0_0_6px_var(--color-mint)]" />
            Monad testnet · {monadTestnet.id}
          </span>
          {block !== undefined && <span>block <span className="text-cyan">#{block.toString()}</span></span>}
          {FACTORY_ADDRESS && (
            <a className="hover:text-cyan" href={EXPLORER.address(FACTORY_ADDRESS)} target="_blank" rel="noreferrer">
              factory {shortAddr(FACTORY_ADDRESS)} ↗
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
