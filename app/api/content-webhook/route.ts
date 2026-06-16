// CineRealm — Content Webhook Receiver
// POST /api/content-webhook
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tema, instagram, x_twitter, youtube, realm, generated_at } = body;
    if (!tema) return NextResponse.json({ error: "tema required" }, { status: 400 });

    const supabase = createServiceClient();
    await supabase.from("content_log").insert({
      tema, instagram: instagram || {}, x_twitter: x_twitter || {},
      youtube: youtube || {}, realm: realm || "cine",
      generated_at: generated_at || new Date().toISOString(), status: "received",
    });

    return NextResponse.json({ success: true, tema });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", webhook: "CineRealm Content Receiver" });
}
