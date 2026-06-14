// CineRealm: ChatFlow Component (updated)
// WhatsApp/Slack-style message bubbles with reply chains, phase indicators, and round numbers

import type { MessageWithAgent } from "@/types/database";
import { ChatBubble } from "./ChatBubble";

interface ChatFlowProps {
  messages: MessageWithAgent[];
  bookTitle: string;
  sessionLabel: string;
}

const PHASE_LABELS: Record<string, string> = {
  opening: "Phase 1 — Opening Statements",
  reaction: "Phase 2 — Pushback & Tension",
  deepening: "Phase 3 — Deepening & Nuance",
  closing: "Phase 4 — Synthesis & Growth",
};

const PHASE_DESCRIPTIONS: Record<string, string> = {
  opening: "Each debater presents their initial analysis through their unique philosophical lens.",
  reaction: "Avatars challenge each other's assumptions. Intellectual sparks fly.",
  deepening: "Arguments gain nuance. Unexpected alliances form.",
  closing: "Synthesis emerges. Avatars reveal how the debate changed their view.",
};

const MESSAGES_PER_ROUND = 3;

export function ChatFlow({ messages, bookTitle, sessionLabel }: ChatFlowProps) {
  if (messages.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground">
        <p className="text-lg font-heading font-semibold mb-2">Discussion in progress</p>
        <p>
          AI viewers are analyzing &quot;{bookTitle}&quot;. Check back soon for the full conversation.
        </p>
      </div>
    );
  }

  // Group messages by phase
  const phases = new Map<string, MessageWithAgent[]>();
  for (const msg of messages) {
    const phase = msg.phase || "opening";
    if (!phases.has(phase)) phases.set(phase, []);
    phases.get(phase)!.push(msg);
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Header */}
      <div className="p-5 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-semibold text-[#c9a96e] text-base">
              🏟️ {bookTitle} — Debate Room
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{sessionLabel}</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{messages.length} messages</span>
            <span>·</span>
            <span>{phases.size} phases</span>
          </div>
        </div>
      </div>

      {/* Messages by phase */}
      <div>
        {Array.from(phases.entries()).map(([phase, phaseMsgs], phaseIdx) => {
          // Split phase messages into rounds (3 messages per round)
          const rounds: MessageWithAgent[][] = [];
          for (let i = 0; i < phaseMsgs.length; i += MESSAGES_PER_ROUND) {
            rounds.push(phaseMsgs.slice(i, i + MESSAGES_PER_ROUND));
          }

          return (
            <div key={phase}>
              {/* Phase Header */}
              <div className="px-5 py-3 bg-background/80 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-[#c9a96e]">
                    {phaseIdx === 0 ? "🔵" : phaseIdx === 1 ? "🟡" : phaseIdx === 2 ? "🟠" : "🟢"}
                  </span>
                  <h3 className="text-xs uppercase tracking-widest text-[#c9a96e] font-semibold">
                    {PHASE_LABELS[phase] || phase}
                  </h3>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 ml-6">
                  {PHASE_DESCRIPTIONS[phase] || ""}
                </p>
              </div>

              {/* Rounds within phase */}
              {rounds.map((roundMsgs, roundIdx) => (
                <div key={roundIdx}>
                  {rounds.length > 1 && (
                    <div className="px-5 py-1.5 bg-background/40 border-b border-border/30">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                        Round {roundIdx + 1}
                      </span>
                    </div>
                  )}
                  <div className="divide-y divide-border/30">
                    {roundMsgs.map((msg) => {
                      const replyTo = msg.reply_to_agent
                        ? messages.find((m) => m.agent_id === msg.reply_to_agent)
                        : null;

                      return (
                        <ChatBubble
                          key={msg.id}
                          message={msg}
                          replyToAgent={replyTo?.agent || null}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
