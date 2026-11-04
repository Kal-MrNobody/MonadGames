import { NextResponse } from "next/server";
import { z } from "zod";
import { createWalletClient, createPublicClient, http, isAddress, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getGame } from "@/lib/store";
import { monadTestnet, MONAD_RPC_URL } from "@/lib/chain";
import { gameFactoryAbi } from "@/lib/contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  gameId: z.string().min(1).max(200),
  player: z.string().refine((a) => isAddress(a), "invalid address"),
  score: z.number().finite().min(0),
});

const MAX_TOKENS = 1000;
const COOLDOWN_MS = 30_000;
const g = globalThis as unknown as { __mgRewardRL?: Map<string, number> };
const lastReward = (g.__mgRewardRL ??= new Map<string, number>());

export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid body", details: e instanceof z.ZodError ? e.issues : undefined }, { status: 400 });
  }

  const game = await getGame(body.gameId);
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  if (!game.tokenAddress) return NextResponse.json({ error: "Game has no token" }, { status: 400 });

  const pk = process.env.REWARDER_PRIVATE_KEY;
  const factory = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}` | undefined;
  if (!pk || !factory) return NextResponse.json({ error: "Rewards not configured" }, { status: 503 });

  const tokens = Math.min(Math.floor(body.score), MAX_TOKENS);
  if (tokens <= 0) return NextResponse.json({ txHash: null, amount: 0, skipped: true });

  const player = body.player as `0x${string}`;
  const key = `${player.toLowerCase()}:${game.id}`;
  const now = Date.now();
  const last = lastReward.get(key);
  if (last && now - last < COOLDOWN_MS) {
    return NextResponse.json({ error: `Slow down — one reward per ${COOLDOWN_MS / 1000}s per game` }, { status: 429 });
  }
  lastReward.set(key, now);

  try {
    const account = privateKeyToAccount((pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`);
    const wallet = createWalletClient({ account, chain: monadTestnet, transport: http(MONAD_RPC_URL) });
    const txHash = await wallet.writeContract({
      address: factory,
      abi: gameFactoryAbi,
      functionName: "reward",
      args: [game.tokenAddress, player, parseUnits(String(tokens), 18)],
    });
    try {
      const pub = createPublicClient({ chain: monadTestnet, transport: http(MONAD_RPC_URL) });
      await pub.waitForTransactionReceipt({ hash: txHash, timeout: 20_000 });
    } catch {
      // timed out or receipt lookup failed — the tx is still submitted, return the hash
    }
    return NextResponse.json({ txHash, amount: tokens });
  } catch (e) {
    lastReward.delete(key);
    const msg = (e as { shortMessage?: string }).shortMessage || (e as Error).message;
    return NextResponse.json({ error: `Reward tx failed: ${msg}` }, { status: 500 });
  }
}
