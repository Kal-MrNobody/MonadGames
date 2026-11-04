"use client";
import { useEffect, useRef } from "react";
import { BRIDGE_SOURCE, type BridgeMessage } from "@/lib/bridge";

interface Props {
  html: string;
  title?: string;
  className?: string;
  onReady?: () => void;
  onScore?: (score: number) => void;
  onGameOver?: (score: number) => void;
}

/** Sandboxed game iframe. NO allow-same-origin: the game cannot touch the host app, cookies or wallet. */
export function GameFrame({ html, title = "game", className = "", onReady, onScore, onGameOver }: Props) {
  const ref = useRef<HTMLIFrameElement>(null);
  const cbs = useRef({ onReady, onScore, onGameOver });
  cbs.current = { onReady, onScore, onGameOver };

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!ref.current || e.source !== ref.current.contentWindow) return;
      const d = e.data as BridgeMessage | undefined;
      if (!d || typeof d !== "object" || d.source !== BRIDGE_SOURCE) return;
      if (d.type === "ready") cbs.current.onReady?.();
      else if (d.type === "score" && Number.isFinite(d.score)) cbs.current.onScore?.(d.score);
      else if (d.type === "gameover" && Number.isFinite(d.score)) cbs.current.onGameOver?.(d.score);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={ref}
      title={title}
      sandbox="allow-scripts"
      srcDoc={html}
      className={`block h-full w-full rounded-2xl border border-line bg-black ${className}`}
    />
  );
}
