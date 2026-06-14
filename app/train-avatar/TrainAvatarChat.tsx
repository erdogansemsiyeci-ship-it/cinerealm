"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { synthesizeAvatarDNA, saveProxyAvatar } from "@/app/actions/avatar";

// ── Interview Questions ───────────────────────────────

const QUESTIONS = [
  {
    id: "q1",
    question:
      "Bir kitabı 30 sayfa içinde bırakma kararı aldıran şey tam olarak nedir? Hangi edebi günahlar senin için affedilemez?",
    field: "dealbreakers",
  },
  {
    id: "q2",
    question:
      "Sence 'çok satan ama kötü yazılmış' bir kitap mı daha değerlidir, yoksa 'mükemmel yazılmış ama kimsenin okumadığı' bir kitap mı? Neden?",
    field: "value_system",
  },
  {
    id: "q3",
    question:
      "Bir yazarın metninde seni en çok heyecanlandıran, 'bu işte usta' dedirten teknik nedir? Spesifik bir örnek ver.",
    field: "craft_admiration",
  },
  {
    id: "q4",
    question:
      "Editör olarak en büyük kör noktan ne? Hangi tür metinlerde objektif kalamayacağını düşünüyorsun?",
    field: "blind_spots",
  },
];

type Message = {
  role: "interviewer" | "user" | "system";
  content: string;
};

type Phase = "intro" | "interviewing" | "synthesizing" | "naming" | "done";

// ── Typing animation hook ─────────────────────────────

function useTypewriter(text: string, speed = 8) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) return;
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

// ── Main Component ────────────────────────────────────

export default function TrainAvatarChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; question: string; answer: string }[]>([]);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [avatarName, setAvatarName] = useState("");
  const [avatarTitle, setAvatarTitle] = useState("");
  const [hirePrice, setHirePrice] = useState("25");
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start interview on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const timer = setTimeout(() => {
      setMessages([
        {
          role: "interviewer",
          content:
            "Welcome to the Mind Cloning Lab. I'm going to ask you 4 questions that will reveal your editorial DNA. Be honest — your future AI avatar will inherit every bias and brilliance you share.\n\nReady? Here's the first question:",
        },
      ]);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { role: "interviewer", content: QUESTIONS[0].question },
        ]);
        setPhase("interviewing");
      }, 1200);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  // Focus input when phase changes
  useEffect(() => {
    if (phase === "interviewing" || phase === "naming") {
      inputRef.current?.focus();
    }
  }, [phase]);

  const handleSend = () => {
    if (!input.trim() || isPending) return;

    if (phase === "interviewing") {
      const currentQ = QUESTIONS[questionIndex];
      const newAnswer = { questionId: currentQ.id, question: currentQ.question, answer: input.trim() };
      const newAnswers = [...answers, newAnswer];

      setMessages((prev) => [...prev, { role: "user", content: input.trim() }]);
      setAnswers(newAnswers);
      setInput("");

      const nextIdx = questionIndex + 1;
      if (nextIdx < QUESTIONS.length) {
        setQuestionIndex(nextIdx);
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { role: "interviewer", content: QUESTIONS[nextIdx].question },
          ]);
        }, 800);
      } else {
        // All questions answered — synthesize DNA
        setPhase("synthesizing");
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: "Analyzing your responses... Synthesizing editorial DNA...",
          },
        ]);
        startTransition(async () => {
          const result = await synthesizeAvatarDNA(
            newAnswers,
            "Pending", // name will be set in naming phase
            "Pending"
          );
          if (result.error) {
            setMessages((prev) => [...prev, { role: "system", content: `Error: ${result.error}` }]);
            setPhase("interviewing");
            return;
          }
          setSystemPrompt(result.systemPrompt!);
          setPhase("naming");
          setMessages((prev) => [
            ...prev,
            {
              role: "interviewer",
              content:
                "Your editorial DNA has been synthesized. Now, give your avatar a name and title. What should we call this new editor?",
            },
          ]);
        });
      }
    } else if (phase === "naming") {
      if (!avatarName) {
        setAvatarName(input.trim());
        setInput("");
        setMessages((prev) => [
          ...prev,
          { role: "user", content: input.trim() },
          {
            role: "interviewer",
            content:
              "Great. Now give them a professional title — something like 'Ruthless Pacing Expert' or 'Metaphor Alchemist'.",
          },
        ]);
      } else if (!avatarTitle) {
        setAvatarTitle(input.trim());
        setInput("");
        setMessages((prev) => [
          ...prev,
          { role: "user", content: input.trim() },
          {
            role: "interviewer",
            content:
              "Final question: how many credits should it cost to hire your avatar? (1-1000, suggested: 25)",
          },
        ]);
      } else {
        const price = Math.max(1, Math.min(1000, parseInt(input.trim()) || 25));
        setHirePrice(String(price));
        setInput("");
        setMessages((prev) => [
          ...prev,
          { role: "user", content: `${price} credits` },
          { role: "system", content: "Saving your avatar to the marketplace..." },
        ]);
        setPhase("done");
        setStatusMsg("Saving...");

        startTransition(async () => {
          const fd = new FormData();
          fd.append("avatar_name", avatarName);
          fd.append("avatar_title", avatarTitle);
          fd.append("system_prompt", systemPrompt);
          fd.append("hire_price", String(price));

          const result = await saveProxyAvatar(fd);
          if (result.error) {
            setStatusMsg(`Error: ${result.error}`);
          } else {
            setStatusMsg("Avatar saved! Listing on marketplace...");
          }
        });
      }
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Chat Header */}
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
          🧬
        </div>
        <div>
          <p className="text-sm font-semibold text-heading">Editorial DNA Sequencer</p>
          <p className="text-xs text-muted-foreground">
            {phase === "intro" && "Initializing..."}
            {phase === "interviewing" && `Question ${questionIndex + 1} of ${QUESTIONS.length}`}
            {phase === "synthesizing" && "Synthesizing DNA..."}
            {phase === "naming" && "Naming your avatar"}
            {phase === "done" && "Complete ✓"}
          </p>
        </div>
        {phase === "synthesizing" && (
          <div className="ml-auto flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-primary font-mono">PROCESSING</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {phase !== "done" && (
        <div className="px-5 py-4 border-t border-border flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              phase === "naming" && !avatarName
                ? "Avatar name..."
                : phase === "naming" && !avatarTitle
                ? "Avatar title..."
                : phase === "naming"
                ? "Hire price in credits..."
                : "Type your answer..."
            }
            disabled={isPending || phase === "synthesizing"}
            className="flex-1 px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition disabled:opacity-40"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isPending || phase === "synthesizing"}
            className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-30 transition"
          >
            {isPending ? "..." : phase === "naming" && avatarName && avatarTitle ? "Save" : "Send"}
          </button>
        </div>
      )}

      {/* Done state */}
      {phase === "done" && (
        <div className="px-5 py-6 border-t border-border text-center space-y-4">
          {systemPrompt && (
            <div className="text-left bg-muted/50 border border-border rounded-xl p-4 max-h-40 overflow-y-auto">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                Generated System Prompt (preview)
              </p>
              <p className="text-xs text-foreground/70 font-mono leading-relaxed whitespace-pre-wrap">
                {systemPrompt.slice(0, 500)}
                {systemPrompt.length > 500 && "..."}
              </p>
            </div>
          )}
          <p className="text-sm text-muted-foreground">{statusMsg}</p>
          <a
            href="/marketplace"
            className="inline-block px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
          >
            View Marketplace →
          </a>
        </div>
      )}
    </div>
  );
}

// ── Chat Bubble ────────────────────────────────────────

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="text-xs text-muted-foreground italic bg-muted/50 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
          isUser ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
        }`}
      >
        {isUser ? "Y" : "🧬"}
      </div>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted text-foreground rounded-tl-sm"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
