"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

// ── Types ─────────────────────────────────────────────

export interface AuditFormState {
  errors?: {
    title?: string[];
    server?: string[];
  };
  success?: boolean;
  auditId?: string;
}

// ── Allowed types ─────────────────────────────────────

const ALLOWED_MIMES: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "text/plain": ".txt",
};

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

// ── Get Presigned Upload URL ──────────────────────────

export async function getPresignedUploadUrl(
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<{ url?: string; token?: string; path?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!ALLOWED_MIMES[fileType] && !Object.values(ALLOWED_MIMES).includes(`.${ext}`)) {
    return { error: "Invalid file type. Accepted: .pdf, .docx, .txt" };
  }
  if (fileSize > MAX_FILE_SIZE) {
    return { error: "File too large. Max 500 MB." };
  }

  const serviceClient = createServiceClient();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${Date.now()}_${safeName}`;

  const { data, error } = await serviceClient.storage
    .from("manuscripts")
    .createSignedUploadUrl(path);

  if (error || !data?.signedUrl) {
    return { error: error?.message || "Failed to generate upload URL" };
  }

  return { url: data.signedUrl, token: data.token, path };
}

// ── Create Audit After Upload ─────────────────────────

export async function createAuditRecord(formData: FormData): Promise<{
  success?: boolean;
  auditId?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const title = (formData.get("title") as string)?.trim() || "";
  const target_genre = (formData.get("target_genre") as string) || "";
  const expectation = (formData.get("expectation") as string) || "";
  const author_notes = (formData.get("author_notes") as string)?.trim() || "";
  const storagePath = (formData.get("storage_path") as string) || "";
  const fileName = (formData.get("file_name") as string) || "unknown";
  const fileType = (formData.get("file_type") as string) || "";
  const fileSize = parseInt((formData.get("file_size") as string) || "0", 10);

  if (!title || title.length < 2) {
    return { error: "Please enter a manuscript title." };
  }

  const serviceClient = createServiceClient();

  // Insert manuscript_audits
  const { data: audit, error: insertErr } = await serviceClient
    .from("manuscript_audits")
    .insert({
      user_id: user.id,
      title,
      status: "pending",
      privacy_level: "private",
      aggregate_scores: {
        target_genre,
        expectation,
        author_notes,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        file_url: storagePath
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/manuscripts/${storagePath}`
          : "",
        storage_path: storagePath,
      },
    })
    .select("id")
    .single();

  if (insertErr) return { error: insertErr.message };

  // Insert documents record for text extraction
  await serviceClient.from("documents").insert({
    audit_id: audit.id,
    user_id: user.id,
    file_name: fileName,
    file_type: fileType,
    file_size: fileSize,
    storage_path: storagePath,
    status: "pending",
  });

  revalidatePath("/dashboard");
  return { success: true, auditId: audit.id };
}
