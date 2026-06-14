import { NextRequest } from "next/server";

// ── Mock Editorial Pipeline Steps ────────────────────

const PIPELINE_STEPS = [
  { delay: 800,  msg: "Initializing CineRealm editorial engine v3.2...", type: "info" },
  { delay: 1200, msg: "Connecting to Supabase manuscript storage...", type: "info" },
  { delay: 600,  msg: "Manuscript retrieved — 47,832 words detected.", type: "info" },
  { delay: 900,  msg: "Extracting structural metadata: chapters, sections, dialogue ratio...", type: "info" },
  { delay: 1500, msg: "Metadata extraction complete. 24 chapters, 312 pages estimated.", type: "success" },
  { delay: 1000, msg: "", type: "divider" },
  { delay: 400,  msg: "▸ Deploying Expert Viewer Agents:", type: "header" },
  { delay: 700,  msg: "  ➤ Elias (Systemic Structuralist) — analyzing narrative architecture...", type: "agent" },
  { delay: 1800, msg: "  ✓ Elias: Identified 3-act structure with non-linear flashback in Ch.7. Coherence score: 8.2/10", type: "success" },
  { delay: 500,  msg: "  ➤ Clara (Psychological Depth) — evaluating character dimensionality...", type: "agent" },
  { delay: 2000, msg: "  ✓ Clara: Protagonist arc strong (0→1 transformation). Secondary characters need deepening. Depth score: 7.1/10", type: "success" },
  { delay: 500,  msg: "  ➤ Victor (Pacing & Hooks) — scanning narrative momentum...", type: "agent" },
  { delay: 1600, msg: "  ✓ Victor: Opening hook effective (8.5/10). Middle act sags Ch.12-15. Pacing score: 6.8/10", type: "success" },
  { delay: 500,  msg: "  ➤ Elena (Formalist Craft) — analyzing prose, syntax, metaphor density...", type: "agent" },
  { delay: 2200, msg: "  ✓ Elena: Prose quality above market average. Metaphor density: 3.2 per page. Craft score: 8.0/10", type: "success" },
  { delay: 500,  msg: "  ➤ Aldric (Existential/Nihilist) — probing philosophical weight...", type: "agent" },
  { delay: 1700, msg: "  ✓ Aldric: Thematic depth present but inconsistent. Existential inquiry score: 6.5/10", type: "success" },
  { delay: 1000, msg: "", type: "divider" },
  { delay: 400,  msg: "▸ Running Predictive Oracle:", type: "header" },
  { delay: 800,  msg: "  ➤ Extracting 20-dimensional fingerprint vector...", type: "info" },
  { delay: 1200, msg: "  ➤ Vector extracted: [6.2, 7.1, 8.0, 5.4, 6.8, 5.9, 7.3, ...]", type: "info" },
  { delay: 900,  msg: "  ➤ Computing cosine similarity against 229 reference movies...", type: "info" },
  { delay: 2000, msg: "  ➤ Top match: 'The Night We Met' (cosine similarity: 0.912)", type: "info" },
  { delay: 700,  msg: "  ➤ Category classification: cinematic_masterpiece", type: "info" },
  { delay: 800,  msg: "  ➤ Market tier estimation: B (100K-500K copies) — confidence: 78%", type: "success" },
  { delay: 1000, msg: "", type: "divider" },
  { delay: 400,  msg: "▸ Synthesizing Editorial Report:", type: "header" },
  { delay: 1500, msg: "  ➤ Leo 'The Hook' Vance drafting final audit...", type: "info" },
  { delay: 2000, msg: "  ✓ Report generated — 5 dimensions scored, 3 critical suggestions.", type: "success" },
  { delay: 800,  msg: "", type: "divider" },
  { delay: 200,  msg: "═══════════════════════════════════════════", type: "info" },
  { delay: 200,  msg: "  EDITORIAL AUDIT COMPLETE", type: "complete" },
  { delay: 200,  msg: "  Report saved to manuscript_audits", type: "complete" },
  { delay: 200,  msg: "═══════════════════════════════════════════", type: "info" },
];

const TOTAL_DELAY = PIPELINE_STEPS.reduce((sum, s) => sum + s.delay, 0);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const auditId = searchParams.get("id") || "unknown";

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ auditId, totalSteps: PIPELINE_STEPS.length })}\n\n`)
      );

      let stepIndex = 0;

      for (const step of PIPELINE_STEPS) {
        // Check if client disconnected
        if (request.signal.aborted) break;

        await sleep(step.delay);

        const payload = JSON.stringify({
          index: stepIndex++,
          msg: step.msg,
          type: step.type,
          progress: Math.round((stepIndex / PIPELINE_STEPS.length) * 100),
        });

        controller.enqueue(encoder.encode(`event: log\ndata: ${payload}\n\n`));
      }

      // Final completion event
      controller.enqueue(
        encoder.encode(
          `event: done\ndata: ${JSON.stringify({
            auditId,
            completed: true,
            totalDuration: `${(TOTAL_DELAY / 1000).toFixed(1)}s`,
          })}\n\n`
        )
      );

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
