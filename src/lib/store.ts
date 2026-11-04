// Server-only module (uses fs).
import fs from "fs";
import path from "path";
import type { GameRecord } from "./types";
import { getTemplate } from "@/games/registry";
import { buildGameRecord } from "./generate";
import { injectBridge } from "./bridge";

const DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "games.json");

// Live Monad testnet deployment (contracts/deployments/monadTestnet.json)
const LIVE_FACTORY = "0xd639772dcf6bcc924d075df0e9c66e4ed2de99d4";
const LIVE_DEMO_TOKEN = "0xd7D23bF713C3C9473858C182Fc94a75553eB470A";
const LIVE_DEPLOYER = "0xC07d95248860eD400A3964154e9169903Cbfa8ce" as const;

let cache: GameRecord[] | null = null;
let fsWritable = true;

function seed(): GameRecord[] {
  const demos: [string, string, string, Record<string, unknown>][] = [
    ["flappy", "Flappy Nad", "a flappy bird where a purple nad flies through monad pipes", { playerEmoji: "🦄", tokenSymbol: "FNAD" }],
    ["snake", "Parallel Snake", "snake game that eats blocks at 10,000 TPS", { foodEmojis: ["🧊", "💜", "⚡"], tokenSymbol: "PSNK", difficulty: 1.2 }],
    ["runner", "Gmonad Dash", "endless runner jumping over gas fees", { playerEmoji: "🏃", obstacleEmojis: ["⛽", "🐌", "🧱"], coinEmoji: "💜", tokenSymbol: "GMON" }],
    ["shooter", "Mempool Invaders", "space shooter blasting MEV bots", { enemyEmojis: ["🤖", "👾", "🦠"], tokenSymbol: "MEV", primaryColor: "#A0055D" }],
  ];
  const now = Date.now();
  const games = demos.map(([tid, title, prompt, extra], i) => {
    const t = getTemplate(tid)!;
    const g = buildGameRecord(t, prompt, { ...t.defaultConfig, ...extra, title });
    g.createdAt = now - (i + 1) * 60_000;
    g.plays = [42, 17, 63, 28][i];
    return g;
  });
  // On the live testnet deployment, the first demo is wired to the token minted by `DEMO=1 npm run deploy:monad`,
  // so a fresh checkout has a game that pays real rewards.
  const factory = (process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "").toLowerCase();
  const demoToken = process.env.DEMO_TOKEN_ADDRESS || (factory === LIVE_FACTORY ? LIVE_DEMO_TOKEN : undefined);
  if (demoToken && /^0x[0-9a-fA-F]{40}$/.test(demoToken)) {
    const g = games[0];
    g.id = "demo-flappy";
    g.tokenAddress = demoToken as `0x${string}`;
    g.tokenSymbol = "FLAP";
    g.config = { ...g.config, tokenSymbol: "FLAP" };
    g.creator = LIVE_DEPLOYER;
  }
  return games;
}

function persist() {
  if (!fsWritable || !cache) return;
  try {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(cache));
  } catch {
    fsWritable = false; // read-only FS (serverless) — keep in memory
  }
}

function load(): GameRecord[] {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) cache = parsed as GameRecord[];
  } catch {
    /* missing or corrupt */
  }
  if (!cache || cache.length === 0) {
    cache = seed();
    persist();
  }
  return cache;
}

export async function listGames(): Promise<GameRecord[]> {
  return [...load()].sort((a, b) => b.createdAt - a.createdAt);
}

export async function getGame(id: string): Promise<GameRecord | undefined> {
  return load().find((g) => g.id === id);
}

export async function saveGame(g: GameRecord): Promise<GameRecord> {
  const games = load();
  const i = games.findIndex((x) => x.id === g.id);
  if (i >= 0) games[i] = g;
  else games.push(g);
  persist();
  return g;
}

export async function updateGame(id: string, patch: Partial<GameRecord>): Promise<GameRecord | undefined> {
  const games = load();
  const i = games.findIndex((x) => x.id === id);
  if (i < 0) return undefined;
  const { id: _ignore, ...rest } = patch;
  const next: GameRecord = { ...games[i], ...rest };
  if (patch.title || patch.tokenSymbol) {
    next.config = { ...next.config, ...(patch.title ? { title: patch.title } : {}), ...(patch.tokenSymbol ? { tokenSymbol: patch.tokenSymbol } : {}) };
    const t = getTemplate(next.templateId);
    if (t) next.html = injectBridge(t.html, next.config);
  }
  games[i] = next;
  persist();
  return next;
}

export async function incrementPlays(id: string): Promise<GameRecord | undefined> {
  const games = load();
  const g = games.find((x) => x.id === id);
  if (!g) return undefined;
  g.plays = (g.plays || 0) + 1;
  persist();
  return g;
}
