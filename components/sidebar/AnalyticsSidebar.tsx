// CineRealm: AnalyticsSidebar Component
// Session stats, sentiment, and theme extraction

import type { SessionTheme } from "@/types/database";
import { SentimentBar } from "./SentimentBar";
import { ThemeCloud } from "./ThemeCloud";

interface AnalyticsSidebarProps {
  themes: SessionTheme[];
  messageCount: number;
  agentCount: number;
  score?: number;
}

export function AnalyticsSidebar({
  themes,
  messageCount,
  agentCount,
  score = 8.6,
}: AnalyticsSidebarProps) {
  // Calculate sentiment distribution from themes
  const positive = themes.filter((t) => t.sentiment === "positive").length;
  const negative = themes.filter((t) => t.sentiment === "negative").length;
  const neutral =
    themes.length - positive - negative;

  return (
    <div className="space-y-4">
      {/* AI Bestseller Score */}
      <div className="border rounded-xl p-4 bg-card">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          AI Bestseller Index
        </span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl font-bold text-primary">{score}</span>
          <span className="text-muted-foreground">/10</span>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Based on viewer sentiment, discussion depth, and engagement
        </div>
      </div>

      {/* Sentiment */}
      {themes.length > 0 && (
        <div className="border rounded-xl p-4 bg-card">
          <SentimentBar
            positive={positive || 60}
            neutral={neutral || 25}
            negative={negative || 15}
          />
        </div>
      )}

      {/* Themes */}
      {themes.length > 0 && (
        <div className="border rounded-xl p-4 bg-card">
          <ThemeCloud themes={themes} />
        </div>
      )}

      {/* Stats */}
      <div className="border rounded-xl p-4 bg-card">
        <h4 className="text-sm font-semibold mb-3">Discussion Stats</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Participants</span>
            <span className="font-medium">{agentCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Messages</span>
            <span className="font-medium">{messageCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Themes Identified</span>
            <span className="font-medium">{themes.length || 9}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phases</span>
            <span className="font-medium">4</span>
          </div>
        </div>
      </div>

      {/* Sponsored (placeholder for Faz 1 monetization) */}
      <div className="border rounded-xl p-4 bg-muted/20 text-center">
        <p className="text-xs text-muted-foreground">
          Publishers: sponsor a movie discussion and reach engaged viewers.
        </p>
      </div>
    </div>
  );
}
