import { NextRequest, NextResponse } from "next/server";
import { getAllAnnotations, setAnnotation } from "@/lib/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const annotations = await getAllAnnotations();
    return NextResponse.json({ annotations });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const invoiceNumber: string = body.invoiceNumber;
    const patch = body.patch || {};
    if (!invoiceNumber) {
      return NextResponse.json({ error: "invoiceNumber required" }, { status: 400 });
    }
    const merged = await setAnnotation(invoiceNumber, patch);
    return NextResponse.json({ ok: true, annotation: merged });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
