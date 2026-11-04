"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "./WalletButton";

const links = [
  { href: "/", label: "Explore" },
  { href: "/create", label: "Create" },
  { href: "/my", label: "My games" },
];

export function Navbar() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-ink/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-monad text-lg glow">🎮</span>
          <span className="hidden sm:inline">Monad<span className="text-monad-light">Games</span></span>
        </Link>
        <nav className="ml-2 flex gap-1 text-sm">
          {links.map((l) => {
            const active = l.href === "/" ? path === "/" : path?.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href}
                className={`rounded-lg px-2.5 py-1.5 transition ${active ? "bg-white/10 text-white" : "text-white/60 hover:text-white"}`}>
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto"><WalletButton /></div>
      </div>
    </header>
  );
}
