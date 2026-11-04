// Client-side fetch helpers for the MonadGames API.
import type { GameRecord } from "./types";

export type GameSummary = Omit<GameRecord, "html"> & { html?: string };
export interface TemplateInfo { id: string; name: string; description: string; icon: string; category: string }

async function j<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}

export const api = {
  games: () => fetch("/api/games", { cache: "no-store" }).then((r) => j<{ games: GameSummary[] }>(r)),
  game: (id: string) => fetch(`/api/games/${id}`, { cache: "no-store" }).then((r) => j<{ game: GameRecord }>(r)),
  templates: () => fetch("/api/templates").then((r) => j<{ templates: TemplateInfo[] }>(r)),
  generate: (prompt: string, creator?: string) =>
    fetch("/api/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt, creator }) }).then((r) => j<{ game: GameRecord }>(r)),
  remix: (id: string, prompt: string) =>
    fetch(`/api/games/${id}/remix`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt }) }).then((r) => j<{ game: GameRecord }>(r)),
  patch: (id: string, patch: Partial<Pick<GameRecord, "tokenAddress" | "tokenSymbol" | "creator" | "playFeeWei" | "title">>) =>
    fetch(`/api/games/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) }).then((r) => j<{ game: GameRecord }>(r)),
  play: (id: string) => fetch(`/api/games/${id}/play`, { method: "POST" }).then((r) => j<{ ok: boolean }>(r)),
  reward: (gameId: string, player: string, score: number) =>
    fetch("/api/reward", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ gameId, player, score }) }).then((r) => j<{ txHash: string; amount: number; skipped?: boolean }>(r)),
};

export const TEMPLATE_ICONS: Record<string, string> = {
  flappy: "🐤", snake: "🐍", runner: "🏃", tap: "👆", breakout: "🧱", memory: "🧠", dodge: "☄️", clicker: "🖱️", "2048": "🔢", jumper: "🦘",
};
