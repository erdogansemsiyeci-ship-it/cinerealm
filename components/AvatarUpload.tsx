"use client";

// CineRealm — Avatar Upload & Stylize Component
// Uploads selfie → Supabase storage → AI stylization → result

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "uploading" | "stylizing" | "done" | "error";

interface Props {
  agentId?: string;
  onComplete?: (stylizedUrl: string) => void;
  className?: string;
}

const STORAGE_BUCKET = "avatars";

export function AvatarUpload({ agentId, onComplete, className = "" }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stylizedUrl, setStylizedUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  // ── Handle file selection ────────────────────────────────────
  const handleFile = useCallback(
    async (file: File) => {
      // Validate
      if (!file.type.startsWith("image/")) {
        setErrorMsg("Please upload an image file (PNG, JPG, WebP).");
        setStatus("error");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("Image must be under 5MB.");
        setStatus("error");
        return;
      }

      setErrorMsg(null);
      setStylizedUrl(null);

      // Show preview
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      try {
        // ── Phase 1: Upload to Supabase Storage ──────────────
        setStatus("uploading");
        const filePath = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

        const { error: uploadErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, file, {
            cacheControl: "31536000",
            upsert: false,
          });

        if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(filePath);

        const publicUrl = urlData?.publicUrl;
        if (!publicUrl) throw new Error("Could not get public URL");

        // ── Phase 2: AI Stylization ──────────────────────────
        setStatus("stylizing");
        const resp = await fetch("/api/avatar/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: publicUrl, agentId }),
        });

        const result = await resp.json();

        if (!resp.ok || result.error) {
          throw new Error(result.error || result.detail || "Stylization failed");
        }

        // ── Done ─────────────────────────────────────────────
        setStylizedUrl(result.stylizedUrl);
        setStatus("done");
        onComplete?.(result.stylizedUrl);
      } catch (err: any) {
        setErrorMsg(err.message || "Something went wrong.");
        setStatus("error");
      }
    },
    [agentId, onComplete, supabase]
  );

  // ── Drag & drop handlers ─────────────────────────────────────
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className={className}>
      {/* ═══════════════════════════════════════════════════════
          Upload area
          ═══════════════════════════════════════════════════════ */}
      {status === "idle" && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer
            hover:border-[#c9a96e]/40 hover:bg-[#c9a96e]/5 transition-all group"
        >
          <div className="text-4xl mb-4 opacity-40 group-hover:opacity-60 transition-opacity">
            🎭
          </div>
          <h3 className="font-heading text-lg text-foreground mb-2">
            Upload Your Selfie
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Drag & drop or click to browse. We'll transform it into a
            cinematic digital painting.
          </p>
          <p className="text-[10px] text-muted-foreground mt-3">
            PNG, JPG, WebP — max 5MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="hidden"
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          Uploading state
          ═══════════════════════════════════════════════════════ */}
      {status === "uploading" && (
        <div className="border border-border rounded-xl p-12 text-center bg-card">
          <div className="animate-spin w-10 h-10 border-2 border-[#c9a96e] border-t-transparent rounded-full mx-auto mb-4" />
          <h3 className="font-heading text-lg text-foreground mb-1">
            Uploading your photo...
          </h3>
          <p className="text-sm text-muted-foreground">
            Securing your image in the CineRealm vault.
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          Stylizing state
          ═══════════════════════════════════════════════════════ */}
      {status === "stylizing" && (
        <div className="border border-[#c9a96e]/20 rounded-xl p-12 text-center bg-[#c9a96e]/5">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 border-2 border-[#c9a96e]/30 rounded-full animate-ping" />
            <div className="absolute inset-2 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">
              🎨
            </div>
          </div>
          <h3 className="font-heading text-xl text-[#c9a96e] mb-2">
            Stylizing your critic persona...
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Our AI is painting your portrait in the signature CineRealm style —
            cinematic lighting, muted palette, subtle brush strokes.
          </p>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-24 h-24 rounded-full object-cover mx-auto mt-6 opacity-50 border-2 border-[#c9a96e]/20"
            />
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          Done state
          ═══════════════════════════════════════════════════════ */}
      {status === "done" && stylizedUrl && (
        <div className="border border-[#c9a96e]/20 rounded-xl p-8 text-center bg-card">
          <div className="text-3xl mb-4">✨</div>
          <h3 className="font-heading text-xl text-foreground mb-2">
            Your Critic Persona Is Ready
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Behold your stylized avatar — ready to join the Editorial Board.
          </p>
          <div className="relative inline-block">
            <img
              src={stylizedUrl}
              alt="Stylized avatar"
              className="w-48 h-48 rounded-2xl object-cover border-2 border-[#c9a96e]/30 shadow-lg shadow-[#c9a96e]/10"
            />
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#c9a96e] text-black text-xs font-medium">
              Stylized Portrait
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => {
                setStatus("idle");
                setPreviewUrl(null);
                setStylizedUrl(null);
              }}
              className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:border-[#c9a96e]/30 hover:text-foreground transition-colors"
            >
              Upload Another
            </button>
            {stylizedUrl && (
              <a
                href={stylizedUrl}
                download="cinerealm-avatar.webp"
                target="_blank"
                rel="noopener"
                className="px-4 py-2 rounded-lg bg-[#c9a96e] text-black text-sm font-medium hover:bg-[#d4b87a] transition-colors"
              >
                Download
              </a>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          Error state
          ═══════════════════════════════════════════════════════ */}
      {status === "error" && (
        <div className="border border-red-500/20 rounded-xl p-8 text-center bg-red-500/5">
          <div className="text-3xl mb-3">⚠️</div>
          <h3 className="font-heading text-lg text-foreground mb-1">
            Something went wrong
          </h3>
          <p className="text-sm text-red-400 mb-4">{errorMsg}</p>
          <button
            onClick={() => {
              setStatus("idle");
              setErrorMsg(null);
              setPreviewUrl(null);
            }}
            className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:border-[#c9a96e]/30 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
