"use client";
import { useState } from "react";

/** Terminal-style prompt box used on the home and create pages. */
export function PromptConsole({
  onSubmit,
  initial = "",
  busy = false,
  cta = "Generate",
  autoFocus = false,
  value,
  onChange,
}: {
  onSubmit: (p: string) => void;
  initial?: string;
  busy?: boolean;
  cta?: string;
  autoFocus?: boolean;
  value?: string;
  onChange?: (v: string) => void;
}) {
  const [local, setLocal] = useState(initial);
  const text = value ?? local;
  const set = onChange ?? setLocal;
  const submit = () => text.trim() && !busy && onSubmit(text.trim());

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="card-neon glow">
      <div className="flex items-center gap-2 border-b border-monad/30 bg-black/40 px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-pink" />
        <span className="h-2 w-2 rounded-full bg-amber" />
        <span className="h-2 w-2 rounded-full bg-mint" />
        <span className="ml-2 font-mono text-[11px] text-white/40">monadgames://new-game</span>
      </div>
      <div className="flex gap-2 px-3 pt-3">
        <span className="select-none pt-[3px] font-mono text-sm text-cyan">&gt;</span>
        <textarea
          value={text}
          onChange={(e) => set(e.target.value)}
          rows={3}
          autoFocus={autoFocus}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder="a purple ghost collecting gems while dodging bats…"
          aria-label="Describe your game idea"
          className="w-full resize-none bg-transparent font-mono text-[15px] text-white caret-pink outline-none placeholder:text-white/25"
        />
      </div>
      <div className="flex items-center justify-between gap-3 px-3 pb-3">
        <span className="hidden font-mono text-[11px] text-white/35 sm:inline">ENTER ↵ to run · SHIFT+ENTER new line</span>
        <button className="btn-primary ml-auto" disabled={busy || !text.trim()}>
          {busy ? "Compiling…" : `⚡ ${cta}`}
        </button>
      </div>
    </form>
  );
}
