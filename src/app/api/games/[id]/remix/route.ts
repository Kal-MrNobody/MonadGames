import { NextResponse } from "next/server";
import { generateGame } from "@/lib/generate";
import { getGame, saveGame } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const original = await getGame(id);
  if (!original) return NextResponse.json({ error: "not found" }, { status: 404 });
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
    const game = await saveGame(await generateGame(prompt, creator, { templateId: original.templateId }));
    return NextResponse.json({ game });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "remix failed" }, { status: 500 });
  }
}
