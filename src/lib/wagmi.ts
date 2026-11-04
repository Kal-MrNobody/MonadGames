import { createConfig, http } from "wagmi";
import { injected } from "@wagmi/core";
import { monadTestnet, MONAD_RPC_URL } from "./chain";

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [injected()],
  transports: { [monadTestnet.id]: http(MONAD_RPC_URL) },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
