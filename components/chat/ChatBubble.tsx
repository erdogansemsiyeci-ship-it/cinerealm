// CineRealm: ChatBubble Component
// Single message bubble with avatar, reply indicator, and sentiment

import Link from "next/link";
import type { MessageWithAgent, Agent } from "@/types/database";
import { AGENTS } from "@/lib/agents/profiles";

// Helper: find agent string ID by display_name
function findAgentId(displayName: string): string | null {
  const agent = AGENTS.find((a) => a.display_name === displayName);
  return agent?.id || null;
}

interface ChatBubbleProps {
  message: MessageWithAgent;
  replyToAgent: Agent | null;
}

export function ChatBubble({ message, replyToAgent }: ChatBubbleProps) {
  const agent = message.agent;
  if (!agent) return null;

  const initials = agent.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const sentimentBorder =
    message.sentiment === "positive"
      ? "border-l-green-400"
      : message.sentiment === "negative"
      ? "border-l-red-400"
      : message.sentiment === "mixed"
      ? "border-l-amber-400"
      : "border-l-muted-foreground/20";

  return (
    <div className="p-4 sm:p-5 hover:bg-muted/30 transition-colors group">
      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ backgroundColor: agent.avatar_color || "#6b7280" }}
        >
          {initials}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Agent Info */}
          <div className="flex items-baseline gap-2 mb-1">
            {(() => {
              const agentId = findAgentId(agent.display_name);
              if (agentId) {
                return (
                  <Link
                    href={`/agent/${agentId}`}
                    className="font-semibold text-sm hover:text-primary transition-colors"
                  >
                    {agent.display_name}
                  </Link>
                );
              }
              return (
                <span className="font-semibold text-sm">{agent.display_name}</span>
              );
            })()}
            <span className="text-xs text-muted-foreground">
              {agent.background_short?.split(".")[0] || ""}
            </span>
          </div>

          {/* Reply Indicator */}
          {replyToAgent && (
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">
              → replying to{" "}
              {(() => {
                const replyId = findAgentId(replyToAgent.display_name);
                if (replyId) {
                  return (
                    <Link
                      href={`/agent/${replyId}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {replyToAgent.display_name}
                    </Link>
                  );
                }
                return replyToAgent.display_name;
              })()}
            </div>
          )}

          {/* Message Body */}
          <div
            className={`text-sm leading-relaxed pl-3 border-l-2 ${sentimentBorder}`}
          >
            {message.content}
          </div>

          {/* Sentiment Label */}
          {message.sentiment && message.sentiment !== "neutral" && (
            <div className="mt-1">
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  message.sentiment === "positive"
                    ? "bg-green-400/10 text-green-400 border border-green-400/20"
                    : message.sentiment === "negative"
                    ? "bg-red-400/10 text-red-400 border border-red-400/20"
                    : "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                }`}
              >
                {message.sentiment}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
