"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────

interface LogEntry {
  index: number;
  msg: string;
  type: "info" | "success" | "agent" | "header" | "divider" | "complete" | "error";
  progress: number;
}

// ── Color map ─────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  info: "text-[#8ab4f8]",
  success: "text-[#34d399]",
  agent: "text-[#c9a96e]",
  header: "text-[#f0f0f0] font-bold",
  divider: "text-[#4a5568]",
  complete: "text-[#34d399] font-bold",
  error: "text-[#f87171]",
};

// ── Typewriter hook ───────────────────────────────────

function useTypewriter(text: string, speed: number = 8) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayed("");
      setDone(true);
      return;
    }

    setDisplayed("");
    setDone(false);
    let i = 0;
    const chars = text.length;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= chars) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayed, done };
}

// ── Single Log Line ───────────────────────────────────

function LogLine({ entry }: { entry: LogEntry }) {
  const { displayed } = useTypewriter(entry.msg, entry.type === "divider" ? 0 : 10);
  const color = TYPE_COLORS[entry.type] || TYPE_COLORS.info;

  if (entry.type === "divider") {
    return <div className="text-[#4a5568] select-none">─</div>;
  }

  return (
    <div className={`font-mono text-xs leading-relaxed ${color}`}>
      <span className="select-none text-[#4a5568] mr-2">
        [{String(entry.index).padStart(2, "0")}]
      </span>
      {displayed || "\u00A0"}
      {!displayed && <span className="inline-block w-2 h-4 bg-[#c9a96e] animate-pulse align-middle ml-0.5" />}
    </div>
  );
}

// ── Terminal Stream Component ─────────────────────────

interface TerminalStreamProps {
  auditId: string;
  onComplete?: () => void;
}

export default function TerminalStream({ auditId, onComplete }: TerminalStreamProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"connecting" | "streaming" | "complete">("connecting");
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    const url = `/api/audit-stream?id=${encodeURIComponent(auditId)}`;
    const eventSource = new EventSource(url);

    eventSource.addEventListener("connected", (e) => {
      const data = JSON.parse(e.data);
      setStatus("streaming");
    });

    eventSource.addEventListener("log", (e) => {
      const data: LogEntry = JSON.parse(e.data);
      setLogs((prev) => [...prev, data]);
      setProgress(data.progress);
    });

    eventSource.addEventListener("done", () => {
      setStatus("complete");
      eventSource.close();
      onComplete?.();
    });

    eventSource.onerror = () => {
      // SSE will auto-reconnect; if it fails permanently, show error
      if (eventSource.streamyState === EventSource.CLOSED) {
        setLogs((prev) => [
          ...prev,
          { index: prev.length, msg: "Connection lost. Please refresh.", type: "error", progress: progress },
        ]);
      }
    };

    return () => eventSource.close();
  }, [auditId, onComplete]);

  return (
    <div className="bg-[#0a0a0f] border border-[#1e293b] rounded-2xl overflow-hidden shadow-2xl">
      {/* Terminal Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#111118] border-b border-[#1e293b]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 text-center">
          <span className="text-[10px] text-[#64748b] font-mono tracking-wider uppercase">
            bookrealm editorial engine — audit {auditId.slice(0, 8)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {status === "connecting" && (
            <span className="flex items-center gap-1.5 text-[10px] text-[#febc2e] font-mono">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#febc2e] animate-pulse" />
              CONNECTING
            </span>
          )}
          {status === "streaming" && (
            <span className="flex items-center gap-1.5 text-[10px] text-[#34d399] font-mono">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse" />
              LIVE
            </span>
          )}
          {status === "complete" && (
            <span className="text-[10px] text-[#64748b] font-mono">COMPLETE</span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-0.5 bg-[#1e293b]">
        <div
          className="h-full bg-[#c9a96e] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Log Output */}
      <div
        ref={containerRef}
        className="h-80 overflow-y-auto px-5 py-4 space-y-0.5 font-mono scrollbar-thin scrollbar-thumb-[#1e293b] scrollbar-track-transparent"
      >
        {/* Startup banner */}
        {logs.length === 0 && (
          <div className="text-[#64748b] text-xs space-y-1 animate-pulse">
            <div>╔════════════════════════════════════╗</div>
            <div>║  BOOKREALM EDITORIAL ENGINE v3.2  ║</div>
            <div>║  Establishing secure connection... ║</div>
            <div>╚════════════════════════════════════╝</div>
          </div>
        )}

        {logs.map((entry, i) => (
          <LogLine key={i} entry={entry} />
        ))}

        {/* Blinking cursor */}
        {status === "streaming" && (
          <span className="inline-block w-2 h-4 bg-[#c9a96e] animate-pulse align-middle" />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-[#111118] border-t border-[#1e293b] flex items-center justify-between text-[10px] text-[#64748b] font-mono">
        <span>
          {status === "complete"
            ? "Audit complete — report saved"
            : `Processing... ${progress}%`}
        </span>
        <span>{new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
