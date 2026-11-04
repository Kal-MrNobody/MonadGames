"use client";
import { useEffect } from "react";
import { EXPLORER } from "@/lib/chain";

export interface ToastData { kind: "success" | "info" | "error"; title: string; body?: string; txHash?: string }

export function RewardToast({ toast, onClose }: { toast: ToastData | null; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 9000);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  const ring = toast.kind === "success" ? "border-emerald-400/50" : toast.kind === "error" ? "border-red-400/50" : "border-monad/50";
  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className={`card slidein glow w-full max-w-sm border ${ring} p-4`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{toast.kind === "success" ? "🪙" : toast.kind === "error" ? "⚠️" : "✨"}</span>
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{toast.title}</div>
            {toast.body && <div className="mt-0.5 text-sm text-white/60">{toast.body}</div>}
            {toast.txHash && (
              <a href={EXPLORER.tx(toast.txHash)} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-monad-light underline">
                View tx on explorer ↗
              </a>
            )}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>
      </div>
    </div>
  );
}
