"use client";
import { useEffect, useRef } from "react";
import { EXPLORER } from "@/lib/chain";

export interface ToastData { kind: "success" | "info" | "error"; title: string; body?: string; txHash?: string }

export function RewardToast({ toast, onClose }: { toast: ToastData | null; onClose: () => void }) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => close.current(), toast.kind === "info" && toast.title.startsWith("Sending") ? 30000 : 9000);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast) return null;
  const tone =
    toast.kind === "success"
      ? { ring: "border-mint/70", text: "text-mint", shadow: "shadow-[0_0_40px_-8px_var(--color-mint)]", tag: "REWARD" }
      : toast.kind === "error"
        ? { ring: "border-red-400/70", text: "text-red-300", shadow: "shadow-[0_0_40px_-8px_rgba(248,113,113,.8)]", tag: "ERROR" }
        : { ring: "border-monad/70", text: "text-monad-light", shadow: "shadow-[0_0_40px_-8px_var(--color-monad)]", tag: "SYSTEM" };
  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className={`slidein w-full max-w-sm border bg-ink/95 backdrop-blur ${tone.ring} ${tone.shadow} p-4`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{toast.kind === "success" ? "🪙" : toast.kind === "error" ? "⚠️" : "👾"}</span>
          <div className="min-w-0 flex-1">
            <div className={`font-pixel text-[9px] ${tone.text}`}>{tone.tag}</div>
            <div className="mt-1 font-display text-sm font-bold uppercase tracking-wide">{toast.title}</div>
            {toast.body && <div className="mt-0.5 text-sm text-white/60">{toast.body}</div>}
            {toast.txHash && (
              <a href={EXPLORER.tx(toast.txHash)} target="_blank" rel="noreferrer" className="mt-1 inline-block font-mono text-xs text-cyan underline">
                view tx on explorer ↗
              </a>
            )}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>
      </div>
    </div>
  );
}
