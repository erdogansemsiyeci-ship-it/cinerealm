import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// Shared between pipeline and frontend; verify against .env
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET_KEY;

interface WebhookPayload {
  event: "symposium_completed";
  session_id: string;
  movie: {
    title: string;
    author: string;
  };
  article: {
    title: string;
    meta_description: string;
    content: string;
    word_count: number;
    keywords: string[];
  };
  timestamp: string;
}

export async function POST(request: NextRequest) {
  // 1. Authenticate via shared secret in header
  const signature = request.headers.get("X-CineRealm-Signature");

  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Server misconfiguration: WEBHOOK_SECRET_KEY not set" },
      { status: 500 },
    );
  }

  if (signature !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse payload
  let payload: WebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 3. On-demand ISR: purge the article page and the home page
  //    so the new content appears instantly without waiting for the
  //    next revalidate interval.
  const articlePath = `/articles/${payload.session_id}`;
  const pathsToPurge = [articlePath, "/"];

  try {
    for (const p of pathsToPurge) {
      revalidatePath(p);
    }
  } catch (err) {
    // revalidatePath throws if the path has never been rendered;
    // that's fine — the first visitor will cold-render it fresh.
    console.warn("[webhook] revalidatePath warning:", err);
  }

  const webhookReceivedAt = new Date().toISOString();

  console.log(
    `[webhook] ✅ symposium_completed — ${payload.movie.title} ` +
      `(${payload.article.word_count} words) → revalidated ${pathsToPurge.join(", ")} ` +
      `at ${webhookReceivedAt}`,
  );

  return NextResponse.json({
    received: true,
    revalidated: pathsToPurge,
    session_id: payload.session_id,
    movie: payload.movie.title,
    webhook_received_at: webhookReceivedAt,
  });
}
