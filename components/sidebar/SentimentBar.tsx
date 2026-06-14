interface SentimentBarProps {
  positive: number;
  neutral: number;
  negative: number;
}

export function SentimentBar({ positive, neutral, negative }: SentimentBarProps) {
  const total = positive + neutral + negative || 1;

  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Viewer Sentiment</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
        <div
          className="bg-green-400 h-full transition-all"
          style={{ width: `${(positive / total) * 100}%` }}
        />
        <div
          className="bg-amber-400 h-full transition-all"
          style={{ width: `${(neutral / total) * 100}%` }}
        />
        <div
          className="bg-red-400 h-full transition-all"
          style={{ width: `${(negative / total) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-xs mt-1.5">
        <span className="text-green-600 font-medium">Pos: {Math.round((positive / total) * 100)}%</span>
        <span className="text-amber-600 font-medium">Neu: {Math.round((neutral / total) * 100)}%</span>
        <span className="text-red-600 font-medium">Neg: {Math.round((negative / total) * 100)}%</span>
      </div>
    </div>
  );
}
