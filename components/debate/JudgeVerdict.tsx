// CineRealm: JudgeVerdict Component
// Podyum (🥇🥈🥉), gerekçe, hakem değerlendirmesi

interface AgentScore {
  name: string;
  lens: string;
  score: number;
  color: string;
  justification?: string;
}

interface JudgeVerdictProps {
  scores: AgentScore[];
  overallAssessment?: string;
  debateTitle?: string;
}

export function JudgeVerdict({ scores, overallAssessment, debateTitle }: JudgeVerdictProps) {
  // Sort by score descending
  const ranked = [...scores].sort((a, b) => b.score - a.score);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <section className="border border-border rounded-xl bg-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚖️</span>
          <h3 className="font-heading font-semibold text-foreground text-sm uppercase tracking-wider">
            Objective AI Judge Verdict
          </h3>
        </div>
        {debateTitle && (
          <p className="text-xs text-muted-foreground mt-1 ml-8">
            Evaluation of the &quot;{debateTitle}&quot; debate
          </p>
        )}
      </div>

      {/* Podium */}
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {ranked.map((agent, i) => (
            <div
              key={agent.name}
              className={`relative rounded-xl p-4 border transition-all ${
                i === 0
                  ? "border-primary/50 bg-[#c9a96e]/5 sm:order-2"
                  : i === 1
                    ? "border-border bg-background/50 sm:order-1"
                    : "border-border bg-background/50 sm:order-3"
              }`}
            >
              {/* Medal */}
              <div className="absolute -top-3 -right-3 text-2xl">
                {medals[i] || null}
              </div>

              {/* Agent identity */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: agent.color || "#c9a96e" }}
                >
                  {agent.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {agent.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {agent.lens}
                  </p>
                </div>
              </div>

              {/* Score */}
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-bold text-[#c9a96e]">
                  {agent.score}
                </span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>

              {/* Score bar */}
              <div className="w-full h-1.5 bg-background rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${agent.score}%`,
                    background:
                      agent.score >= 90
                        ? "linear-gradient(90deg, #c9a96e, #e0c78a)"
                        : agent.score >= 80
                          ? "linear-gradient(90deg, #c9a96e, #a0946a)"
                          : "linear-gradient(90deg, #888, #666)",
                  }}
                />
              </div>

              {/* Justification */}
              {agent.justification && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {agent.justification}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Overall Assessment */}
      {overallAssessment && (
        <div className="px-5 pb-5">
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-heading font-semibold text-foreground mb-2">
              Overall Assessment
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {overallAssessment}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
