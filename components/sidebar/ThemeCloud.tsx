// Fix ThemeCloud to match our schema
import type { SessionTheme } from "@/types/database";

interface ThemeCloudProps {
  themes: SessionTheme[];
}

export function ThemeCloud({ themes }: ThemeCloudProps) {
  if (themes.length === 0) return null;

  const maxWeight = Math.max(...themes.map((t) => t.weight), 0.5);

  return (
    <div>
      <h4 className="text-sm font-semibold mb-3">Key Themes</h4>
      <div className="flex flex-wrap gap-2">
        {themes
          .sort((a, b) => b.weight - a.weight)
          .map((theme) => {
            const intensity = theme.weight / maxWeight;
            const size =
              intensity > 0.7
                ? "text-sm px-3 py-1.5"
                : intensity > 0.4
                ? "text-xs px-2.5 py-1"
                : "text-xs px-2 py-0.5";

            const sentimentColor =
              theme.sentiment === "positive"
                ? "border-green-300 bg-green-50 text-green-700"
                : theme.sentiment === "negative"
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-primary/20 bg-primary/5 text-primary";

            return (
              <span
                key={theme.id}
                className={`${size} rounded-full border font-medium ${sentimentColor}`}
              >
                {theme.theme}
              </span>
            );
          })}
      </div>
    </div>
  );
}
