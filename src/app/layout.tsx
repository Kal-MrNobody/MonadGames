import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Orbitron, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const body = Chakra_Petch({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body", display: "swap" });
const display = Orbitron({ subsets: ["latin"], weight: ["500", "700", "900"], variable: "--font-orbitron", display: "swap" });
const pixel = Press_Start_2P({ subsets: ["latin"], weight: "400", variable: "--font-pixel-face", display: "swap" });

export const metadata: Metadata = {
  title: "MonadGames — the onchain arcade",
  description: "Type an idea. Get a playable arcade game with its own token on Monad. Players earn for every point.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#06030e" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} ${pixel.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <Providers>
          <Navbar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-4">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
