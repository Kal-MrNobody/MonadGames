import { NextResponse } from "next/server";
import { listGames } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const games = (await listGames()).map(({ html: _html, ...rest }) => rest);
  return NextResponse.json({ games });
}
