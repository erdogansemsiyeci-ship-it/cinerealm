"use client";

import { useState, useCallback } from "react";

interface CopyPromptButtonProps {
  text: string;
}

export default function CopyPromptButton({ text }: CopyPromptButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — silently fail
    }
  }, [text]);

  return (
    <button
      aria-label="Copy system prompt"
      onClick={handleCopy}
      className="text-xs text-muted-foreground hover:text-primary transition-colors px-3 py-1 rounded-lg border border-border hover:border-primary/30"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
