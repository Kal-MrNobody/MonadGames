import { NextResponse } from "next/server";
import { generateGame } from "@/lib/generate";
import { saveGame } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { prompt?: unknown; creator?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    /* empty */
  }
  const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 500) : "";
  if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  const creator = typeof body.creator === "string" ? body.creator : undefined;
  try {
    const game = await saveGame(await generateGame(prompt, creator));
    return NextResponse.json({ game });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "generation failed" }, { status: 500 });
  }
}
