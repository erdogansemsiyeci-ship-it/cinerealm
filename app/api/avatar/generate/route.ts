// CineRealm — AI Avatar Generator API
// Transforms user selfies into stylized digital painting portraits
// Uses Replicate SDK: lucataco/flux-dev-img2img
// POST /api/avatar/generate
// Body: { imageUrl: string, agentId?: string }
// Returns: { stylizedUrl: string }

import { NextResponse } from "next/server";
import Replicate from "replicate";

// ── The hardcoded aesthetic prompt ────────────────────────────
const STYLE_PROMPT =
  "A high-quality digital painting portrait, semi-realistic with subtle brush strokes, " +
  "similar to concept art for a modern dramatic video game. Cinematic lighting, muted " +
  "color palette, solid dark background.";

// ── Model: lucataco/flux-dev-img2img ──────────────────────────
const MODEL = "lucataco/flux-dev-img2img" as const;

export async function POST(request: Request) {
  try {
    const { imageUrl, agentId } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 }
      );
    }

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return NextResponse.json({
        stylizedUrl: imageUrl,
        note: "Stylization skipped — REPLICATE_API_TOKEN not configured.",
      });
    }

    // ── Initialize Replicate SDK ──────────────────────────────
    const replicate = new Replicate({ auth: token });

    // ── Run img2img prediction ────────────────────────────────
    const output = await replicate.run(MODEL as `${string}/${string}`, {
      input: {
        image: imageUrl,
        prompt: STYLE_PROMPT,
        prompt_strength: 0.60,    // retains facial identity, applies heavy style
        num_inference_steps: 28,
        guidance_scale: 7.5,
        output_format: "webp",
        output_quality: 90,
      },
    });

    // Replicate.run returns object — extract URL
    const stylizedUrl = Array.isArray(output)
      ? String(output[0])
      : String((output as any)?.toString?.() ?? output);

    if (!stylizedUrl) {
      return NextResponse.json(
        { error: "No output from Replicate" },
        { status: 502 }
      );
    }

    // ── Update agent avatar in Supabase ──────────────────────
    if (agentId) {
      try {
        const { createServiceClient } = await import(
          "@/lib/supabase/service"
        );
        const supabase = createServiceClient();
        await supabase
          .from("agents")
          .update({ avatar_url: stylizedUrl })
          .eq("id", agentId);
      } catch (dbErr) {
        console.error("[Avatar] DB update failed:", dbErr);
      }
    }

    return NextResponse.json({ stylizedUrl });
  } catch (error: any) {
    console.error("[Avatar] Error:", error);
    return NextResponse.json(
      { error: error.message || "Generation failed" },
      { status: 502 }
    );
  }
}
