// CineRealm — AI Avatar Generator API
// Transforms user selfies into stylized digital painting portraits
// Uses Replicate API (Flux.1 img2img) or falls back gracefully
//
// POST /api/avatar/generate
// Body: { imageUrl: string, agentId?: string }
// Returns: { stylizedUrl: string }

import { NextResponse } from "next/server";

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || "";
const REPLICATE_URL = "https://api.replicate.com/v1/predictions";

// ── The hardcoded aesthetic prompt ────────────────────────────
const STYLE_PROMPT =
  "A high-quality digital painting portrait, semi-realistic with subtle brush strokes, " +
  "similar to concept art for a modern dramatic video game. Cinematic lighting, muted " +
  "color palette, solid dark background.";

// ── Model: Flux.1-dev img2img on Replicate ────────────────────
const MODEL =
  "black-forest-labs/flux-dev:1bbcde0a8a4f8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e";

export async function POST(request: Request) {
  try {
    const { imageUrl, agentId } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 }
      );
    }

    if (!REPLICATE_API_TOKEN) {
      // Graceful fallback — return original image with note
      console.warn("[Avatar] REPLICATE_API_TOKEN not set. Returning original image.");
      return NextResponse.json({
        stylizedUrl: imageUrl,
        note: "Stylization skipped — REPLICATE_API_TOKEN not configured. Add your token to enable AI avatar generation.",
      });
    }

    // ── Call Replicate ──────────────────────────────────────
    const response = await fetch(REPLICATE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
        "Prefer": "wait",
      },
      body: JSON.stringify({
        version: "black-forest-labs/flux-1.1-pro",
        input: {
          image: imageUrl,
          prompt: STYLE_PROMPT,
          image_strength: 0.55,       // keeps facial identity, applies heavy style
          num_inference_steps: 28,
          guidance_scale: 7.5,
          output_format: "webp",
          output_quality: 90,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[Avatar] Replicate error:", err);
      return NextResponse.json(
        { error: "Image generation failed", detail: err },
        { status: 502 }
      );
    }

    const prediction = await response.json();
    const stylizedUrl = prediction?.output;

    if (!stylizedUrl) {
      return NextResponse.json(
        { error: "No output from Replicate" },
        { status: 502 }
      );
    }

    // ── Update agent avatar in Supabase (if agentId provided) ─
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
        // Non-fatal — still return the image
      }
    }

    return NextResponse.json({ stylizedUrl });
  } catch (error: any) {
    console.error("[Avatar] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
