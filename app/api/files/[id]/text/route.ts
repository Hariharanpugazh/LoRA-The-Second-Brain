import { NextResponse, NextRequest } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const entries = await fs.readdir(UPLOAD_DIR);
    const hit = entries.find(n => n.includes(`-${params.id}-`));
    if (!hit) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const abs = path.join(UPLOAD_DIR, hit);

    // simple text-only support for now
    if (!/\.(txt|md|csv|log|json)$/i.test(hit)) {
      return NextResponse.json({ error: "Unsupported type" }, { status: 415 });
    }

    const buf = await fs.readFile(abs);
    // cap to 64KB so prompts don’t explode
    const text = buf.toString("utf8").slice(0, 64 * 1024);
    return new NextResponse(text, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Read failed" }, { status: 500 });
  }
}
