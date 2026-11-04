import type { GameRecord, GameTemplate } from "./types";
import { injectBridge } from "./bridge";
import { matchTemplate } from "./matcher";
import { getTemplate } from "@/games/registry";

export const MONAD_PURPLE = "#836EF9";
export const MONAD_DARK = "#0E0B1A";

const STOP = new Set(
  "a an the and or of to in on at for with without where who that which is are be make create build generate me my i want game games please like some about into from by can you it its as this simple fun cool mini onchain where player players play".split(" ")
);

const COLORS: Record<string, { primaryColor?: string; accentColor?: string; backgroundColor?: string; textColor?: string }> = {
  red: { primaryColor: "#FF4D6D" },
  crimson: { primaryColor: "#DC143C" },
  blue: { primaryColor: "#3B82F6" },
  ocean: { primaryColor: "#0EA5E9", backgroundColor: "#04121F" },
  purple: { primaryColor: "#836EF9" },
  violet: { primaryColor: "#8B5CF6" },
  monad: { primaryColor: "#836EF9" },
  green: { primaryColor: "#22C55E" },
  pink: { primaryColor: "#EC4899" },
  orange: { primaryColor: "#F97316" },
  yellow: { primaryColor: "#FACC15" },
  gold: { primaryColor: "#F5B700", accentColor: "#FFE58A" },
  golden: { primaryColor: "#F5B700", accentColor: "#FFE58A" },
  cyan: { primaryColor: "#06B6D4" },
  teal: { primaryColor: "#14B8A6" },
  neon: { primaryColor: "#39FF14", accentColor: "#FF00E6", backgroundColor: "#05010D" },
  cyberpunk: { primaryColor: "#FF00E6", accentColor: "#00F0FF", backgroundColor: "#07020F" },
  retro: { primaryColor: "#FF6B35", accentColor: "#F7C59F" },
  forest: { primaryColor: "#16A34A", backgroundColor: "#071A0E" },
  fire: { primaryColor: "#EF4444", accentColor: "#F59E0B", backgroundColor: "#1A0605" },
  ice: { primaryColor: "#7DD3FC", accentColor: "#E0F2FE", backgroundColor: "#06121C" },
  black: { backgroundColor: "#000000" },
  dark: { backgroundColor: "#07050F" },
  white: { backgroundColor: "#F5F3FF", textColor: "#1A1530" },
  light: { backgroundColor: "#F5F3FF", textColor: "#1A1530" },
};

const HEX = /^#[0-9a-fA-F]{3,8}$/;
const EMOJI_RE = /\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}|\p{Emoji_Modifier})*/gu;

function titleCase(w: string) {
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

export function slug(s: string): string {
  return (
    s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "game"
  );
}

function rand5(): string {
  const a = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}

export function symbolFromTitle(title: string): string {
  const words = title.toUpperCase().replace(/[^A-Z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  let sym = words.length >= 3 ? words.map((w) => w[0]).join("") : words.join("");
  sym = sym.replace(/[^A-Z]/g, "");
  if (sym.length < 3) sym = (sym + "GAME").slice(0, 4);
  return sym.slice(0, 5);
}

function deriveTitle(prompt: string, template: GameTemplate): string {
  const quoted = prompt.match(/["“']([^"”']{2,40})["”']/);
  if (quoted) return quoted[1].trim();
  const named = prompt.match(/\b(?:called|named|titled)\s+([A-Za-z0-9][\w\s-]{1,30})/i);
  if (named) return named[1].trim().split(/\s+/).slice(0, 4).map(titleCase).join(" ");
  const words = prompt
    .replace(EMOJI_RE, " ")
    .replace(/[^A-Za-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w.toLowerCase()) && !COLORS[w.toLowerCase()]);
  if (!words.length) return String(template.defaultConfig.title || template.name);
  return words.slice(0, 3).map(titleCase).join(" ");
}

export function heuristicConfig(prompt: string, template: GameTemplate): Record<string, unknown> {
  const cfg: Record<string, unknown> = {};
  const lower = prompt.toLowerCase();
  const words = lower.split(/[^a-z]+/).filter(Boolean);
  cfg.title = deriveTitle(prompt, template);

  for (const w of words) {
    const c = COLORS[w];
    if (c) {
      for (const [k, v] of Object.entries(c)) if (cfg[k] === undefined) cfg[k] = v;
    }
  }

  const emojis = prompt.match(EMOJI_RE) || [];
  if (emojis.length) {
    cfg.playerEmoji = emojis[0];
    const rest = emojis.slice(1);
    if (rest.length) {
      const d = template.defaultConfig;
      const listKeys = Object.keys(d).filter((k) => /emoji/i.test(k) && Array.isArray(d[k]) && !/^bad/i.test(k));
      for (const k of listKeys) {
        const def = d[k] as string[];
        // memory needs enough distinct cards; pad with defaults
        cfg[k] = Array.from(new Set([...rest, ...def])).slice(0, Math.max(def.length, rest.length));
      }
    }
  }

  if (/\b(insane|impossible|hardcore|extreme|nightmare)\b/.test(lower)) cfg.difficulty = 2;
  else if (/\b(fast|hard|difficult|quick|speedy|turbo|challenging)\b/.test(lower)) cfg.difficulty = 1.4;
  else if (/\b(slow|easy|chill|relaxing|relaxed|calm|kids|casual|cozy)\b/.test(lower)) cfg.difficulty = 0.7;

  cfg.tokenSymbol = symbolFromTitle(String(cfg.title));
  return cfg;
}

// Keep only keys we know, coerced to the default's type.
function sanitizeAiConfig(raw: unknown, defaults: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  const obj = raw as Record<string, unknown>;
  for (const [k, v] of Object.entries(obj)) {
    if (k === "title" || k === "subtitle") {
      if (typeof v === "string" && v.trim()) out[k] = v.trim().slice(0, k === "title" ? 40 : 200);
      continue;
    }
    if (k === "tokenSymbol") {
      if (typeof v === "string") {
        const s = v.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5);
        if (s.length >= 3) out[k] = s;
      }
      continue;
    }
    if (!(k in defaults)) continue;
    const d = defaults[k];
    if (typeof d === "number") {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) out[k] = Math.min(Math.max(n, d / 4), d * 4);
    } else if (typeof d === "string") {
      if (typeof v !== "string" || !v.trim()) continue;
      if (/color/i.test(k) && !HEX.test(v.trim())) continue;
      out[k] = v.trim().slice(0, 60);
    } else if (Array.isArray(d)) {
      if (Array.isArray(v)) {
        const arr = v.filter((x) => typeof x === "string" && x.trim()).map((x) => String(x).trim().slice(0, 20)).slice(0, 40);
        if (k === "words") {
          const ws = arr.map((w) => w.toUpperCase().replace(/[^A-Z]/g, "")).filter((w) => w.length >= 3 && w.length <= 8);
          if (ws.length >= 3) out[k] = ws;
        } else if (arr.length) out[k] = arr;
      }
    }
  }
  return out;
}

function extractJson(text: string): unknown {
  const t = text.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(t);
  } catch {
    /* fallthrough */
  }
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(t.slice(start, end + 1));
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

async function aiConfig(prompt: string, template: GameTemplate, base: Record<string, unknown>): Promise<Record<string, unknown>> {
  const key = process.env.TOGETHER_API_KEY;
  if (!key) return {};
  const model = process.env.TOGETHER_MODEL || "Qwen/Qwen2.5-Coder-32B-Instruct";
  const sys =
    "You customize HTML5 mini-game templates. Reply with ONLY a JSON object (no prose, no markdown). " +
    "Use exactly the keys of the provided config (same value types), plus \"title\" (short catchy game title, max 30 chars) " +
    "and \"tokenSymbol\" (3-5 uppercase letters). Theme every value (colors as #RRGGBB hex, emojis, numbers, word lists, subtitle instructions) to the user's idea. " +
    "Keep numbers within roughly 0.5x-2x of the defaults. Default theme is Monad purple (#836EF9) on dark (#0E0B1A) unless the idea implies otherwise.";
  const user =
    `Game template: ${template.name} — ${template.description}\n` +
    `Default config:\n${JSON.stringify(template.defaultConfig)}\n` +
    `Heuristic hints (may be improved):\n${JSON.stringify(base)}\n` +
    `User idea: ${prompt}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: "json_object" },
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) return {};
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return {};
    return sanitizeAiConfig(extractJson(content), template.defaultConfig);
  } catch {
    return {};
  } finally {
    clearTimeout(timer);
  }
}

const ADDR = /^0x[0-9a-fA-F]{40}$/;

// Synchronous builder (no AI) — used for seeding and as the final step of generateGame.
export function buildGameRecord(
  template: GameTemplate,
  prompt: string,
  config: Record<string, unknown>,
  creator?: string
): GameRecord {
  const title = String(config.title || template.defaultConfig.title || template.name).slice(0, 40);
  const tokenSymbol =
    typeof config.tokenSymbol === "string" && /^[A-Z]{3,5}$/.test(config.tokenSymbol)
      ? config.tokenSymbol
      : symbolFromTitle(title);
  const finalConfig = { ...config, title, tokenSymbol };
  return {
    id: `${slug(title)}-${rand5()}`,
    title,
    prompt,
    templateId: template.id,
    config: finalConfig,
    html: injectBridge(template.html, finalConfig),
    creator: creator && ADDR.test(creator) ? (creator as `0x${string}`) : undefined,
    tokenSymbol,
    playFeeWei: "0",
    createdAt: Date.now(),
    plays: 0,
  };
}

export async function generateGame(
  prompt: string,
  creator?: string,
  opts: { templateId?: string } = {}
): Promise<GameRecord> {
  const forced = opts.templateId ? getTemplate(opts.templateId) : undefined;
  const template = forced || matchTemplate(prompt).template;
  const heur = heuristicConfig(prompt, template);
  let config: Record<string, unknown> = { ...template.defaultConfig, ...heur };
  const ai = await aiConfig(prompt, template, heur);
  if (Object.keys(ai).length) {
    // AI wins, but explicit emojis typed by the user win over AI.
    config = { ...config, ...ai };
    if (heur.playerEmoji) config.playerEmoji = heur.playerEmoji;
  }
  return buildGameRecord(template, prompt, config, creator);
}
