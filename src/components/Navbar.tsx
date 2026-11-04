"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "./WalletButton";

const links = [
  { href: "/", label: "Arcade" },
  { href: "/create", label: "Create" },
  { href: "/my", label: "Vault" },
];

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative grid h-9 w-9 place-items-center">
        {/* Monad-style rotated diamond mark */}
        <span className="absolute inset-1 rotate-45 rounded-[6px] bg-gradient-to-br from-monad to-pink shadow-[0_0_18px_rgba(131,110,249,.9)]" />
        <span className="absolute inset-[11px] rotate-45 rounded-[3px] bg-ink" />
        <span className="relative h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_var(--color-cyan)]" />
      </span>
      {!small && (
        <span className="font-display text-[15px] font-black uppercase tracking-[.14em]">
          Monad<span className="neon-pink">Games</span>
        </span>
      )}
    </span>
  );
}

export function Navbar() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-monad/25 bg-ink/75 backdrop-blur-md">
      <div className="h-[2px] w-full bg-gradient-to-r from-cyan via-monad to-pink opacity-80" />
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 sm:gap-4">
        <Link href="/" aria-label="MonadGames home" className="shrink-0">
          <span className="sm:hidden"><Logo small /></span>
          <span className="hidden sm:inline"><Logo /></span>
        </Link>
        <nav className="flex gap-0.5 sm:ml-2">
          {links.map((l) => {
            const active = l.href === "/" ? path === "/" : path?.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href}
                className={`relative px-2 py-1.5 font-display text-[10px] font-bold uppercase tracking-[.1em] transition sm:px-3 sm:text-[11px] sm:tracking-[.18em] ${
                  active ? "text-cyan" : "text-white/55 hover:text-white"
                }`}>
                {l.label}
                {active && <span className="absolute inset-x-2 -bottom-[11px] h-[2px] bg-cyan shadow-[0_0_10px_var(--color-cyan)]" />}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto"><WalletButton /></div>
      </div>
    </header>
  );
}
