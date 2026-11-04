import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "MonadGames — Lovable for onchain mini-games",
  description: "Type an idea. Get an onchain game. Own the token. Built on Monad.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b0914" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <Navbar />
          <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-4">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
