// Shared types — the contract between game templates, API, and UI.
export interface GameTemplate {
  id: string;               // e.g. "flappy"
  name: string;             // display name
  description: string;
  icon: string;             // emoji
  category: string;         // "arcade" | "puzzle" | "runner" | "tap" ...
  keywords: string[];       // used by prompt matcher
  // Full self-contained HTML document (inline CSS/JS, no external network).
  // Must read window.GAME_CONFIG (injected) and report scores via postMessage (see GAME_BRIDGE in src/lib/bridge.ts).
  html: string;
  // Default config the AI can customize (colors, title, speeds, emojis, ...)
  defaultConfig: Record<string, unknown>;
}

export interface GameRecord {
  id: string;               // unique game id (slug)
  title: string;
  prompt: string;
  templateId: string;
  config: Record<string, unknown>;
  html: string;             // final rendered HTML (template + config, or AI-modified)
  creator?: `0x${string}`;
  tokenAddress?: `0x${string}`;
  tokenSymbol?: string;
  playFeeWei?: string;      // pay-to-play fee in MON wei ("0" = free)
  createdAt: number;
  plays: number;
}
