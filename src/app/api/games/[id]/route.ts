import { NextResponse } from "next/server";
import { z } from "zod";
import { getGame, updateGame } from "@/lib/store";
import type { GameRecord } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const addr = z.string().regex(/^0x[0-9a-fA-F]{40}$/);
const Patch = z
  .object({
    tokenAddress: addr.optional(),
    tokenSymbol: z.string().regex(/^[A-Za-z0-9]{1,11}$/).optional(),
    creator: addr.optional(),
    playFeeWei: z.string().regex(/^\d{1,40}$/).optional(),
    title: z.string().trim().min(1).max(60).optional(),
  })
  .strip();

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ game });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = Patch.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid patch", issues: parsed.error.issues }, { status: 400 });
  const game = await updateGame(id, parsed.data as Partial<GameRecord>);
  if (!game) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ game });
}
