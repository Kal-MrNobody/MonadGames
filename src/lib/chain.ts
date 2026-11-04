import { defineChain } from "viem";
import { monadTestnet as baseMonad } from "viem/chains";

export const MONAD_RPC_URL =
  process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";

export const EXPLORER_URL = "https://testnet.monadexplorer.com";

// viem ships monadTestnet (id 10143); we override RPC from env.
export const monadTestnet = defineChain({
  ...baseMonad,
  rpcUrls: { default: { http: [MONAD_RPC_URL] } },
  blockExplorers: { default: { name: "Monad Explorer", url: EXPLORER_URL } },
});

export const EXPLORER = {
  tx: (hash: string) => `${EXPLORER_URL}/tx/${hash}`,
  address: (addr: string) => `${EXPLORER_URL}/address/${addr}`,
  token: (addr: string) => `${EXPLORER_URL}/token/${addr}`,
};

export function shortAddr(a?: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}
