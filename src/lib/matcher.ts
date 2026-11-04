import type { GameTemplate } from "./types";
import { templates, getTemplate } from "@/games/registry";

const DEFAULT_ID = "runner";

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(Boolean);
}

// Keyword scoring: exact word hits weigh more than prefix/substring hits; template id/name also count.
export function matchTemplate(prompt: string): { template: GameTemplate; score: number } {
  const words = tokenize(prompt);
  const text = " " + words.join(" ") + " ";
  let best: GameTemplate | undefined;
  let bestScore = 0;
  for (const t of templates) {
    let score = 0;
    const kws = new Set([...t.keywords, t.id, ...tokenize(t.name)]);
    for (const kw of kws) {
      const k = kw.toLowerCase();
      if (text.includes(" " + k + " ")) score += 3;
      else if (k.length >= 4 && words.some((w) => w.startsWith(k) || (w.length >= 4 && k.startsWith(w)))) score += 1.5;
      else if (k.length >= 5 && text.includes(k)) score += 0.5;
    }
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  if (!best) return { template: getTemplate(DEFAULT_ID)!, score: 0 };
  return { template: best, score: bestScore };
}
