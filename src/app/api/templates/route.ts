import { NextResponse } from "next/server";
import { listTemplates } from "@/games/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ templates: listTemplates() });
}
