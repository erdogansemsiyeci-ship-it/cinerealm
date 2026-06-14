"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AvatarProfile } from "@/types/avatar";

type AnalysisFocus = "plot_and_logic" | "character_and_prose" | "systemic_and_roots";
type AgentTone = "empathetic" | "critical" | "systemic_transmitter";

// ─── Quiz flow state ───────────────────────────────────────────
type WizardStep = 1 | 2 | 3;

interface FormData {
  focus: AnalysisFocus | "";
  tone: AgentTone | "";
  favoriteBook: string;
}

interface GenerateResult {
  success: true;
  avatar: AvatarProfile;
}

interface GenerateError {
  success: false;
  error: string;
}

export default function AvatarBuilder() {
  const [step, setStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<FormData>({
    focus: "",
    tone: "",
    favoriteBook: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // ── Step navigation ──────────────────────────────────────
  const handleNext = (field: keyof FormData, value: string) => {
    setError(null);
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (step < 3) setStep((s) => (s + 1) as WizardStep);
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) setStep((s) => (s - 1) as WizardStep);
  };

  // ── API call ─────────────────────────────────────────────
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Authenticate via Supabase Auth session cookie
      const supabase = createClient();
      const {
        data: { session },
        error: authErr,
      } = await supabase.auth.getSession();

      if (authErr) throw new Error("Failed to stream auth session. Please refresh and try again.");

      if (!session?.user?.id) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/avatars/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focus: formData.focus,
          tone: formData.tone,
          favoriteBook: formData.favoriteBook,
          avatarName: undefined, // user can't set a custom name in the wizard
        }),
      });

      const json: GenerateResult | GenerateError = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          "error" in json ? json.error : `Server returned ${res.status}`,
        );
      }

      // Animation grace period — user sees the success pulse before redirect
      setTimeout(() => {
        router.push(`/avatar/${json.avatar.id}`);
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Something went wrong generating your avatar.");
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-xl w-full bg-card rounded-2xl shadow-xl p-8 transition-all">
        {/* ── Progress bar ──────────────────────────────── */}
        <div className="w-full bg-muted h-2 rounded-full mb-8">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* ── Step indicator ────────────────────────────── */}
        <p className="text-sm text-gray-400 mb-4 text-center">
          Step {step} of 3
        </p>

        {/* ── Error banner ──────────────────────────────── */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <span className="font-semibold">Error: </span>
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-3 underline hover:no-underline float-right"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── STEP 1: Analysis Focus ────────────────────── */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Bir kitabi okurken seni en cok neyin eksikligi rahatsiz eder?
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              This shapes what your avatar looks for in every movie.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleNext("focus", "plot_and_logic")}
                className="w-full text-left p-4 border rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition"
              >
                <span className="block font-semibold">Zayif olay orgusu</span>
                <span className="text-sm text-gray-500">
                  Mantik bosluklarina tahammul edemem.
                </span>
              </button>
              <button
                onClick={() => handleNext("focus", "character_and_prose")}
                className="w-full text-left p-4 border rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition"
              >
                <span className="block font-semibold">Ruhsuz diyaloglar</span>
                <span className="text-sm text-gray-500">
                  Karakterler yapay hissettirmemeli.
                </span>
              </button>
              <button
                onClick={() => handleNext("focus", "systemic_and_roots")}
                className="w-full text-left p-4 border rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition"
              >
                <span className="block font-semibold">
                  Yapisal ve kok derinligi
                </span>
                <span className="text-sm text-gray-500">
                  Nesiller arasi aktarimlar ve derin baglar islenmeli.
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Agent Tone ─────────────────────────── */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              CineRealm masasinda tartisirken nasil bir durus sergilersin?
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              This determines your avatar&apos;s voice and rhetorical style.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleNext("tone", "empathetic")}
                className="w-full text-left p-4 border rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition"
              >
                <span className="block font-semibold">Empatik Okur</span>
                <span className="text-sm text-gray-500">
                  Karakterin duygusal dunyasina iner, anlayisla yaklasirim.
                </span>
              </button>
              <button
                onClick={() => handleNext("tone", "critical")}
                className="w-full text-left p-4 border rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition"
              >
                <span className="block font-semibold">Sivri Dilli Elestirmen</span>
                <span className="text-sm text-gray-500">
                  Metindeki bosluklari acimasizca yuzlerine vururum.
                </span>
              </button>
              <button
                onClick={() => handleNext("tone", "systemic_transmitter")}
                className="w-full text-left p-4 border rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition"
              >
                <span className="block font-semibold">Sistemik Aktarici</span>
                <span className="text-sm text-gray-500">
                  Salt sistemik kurallarin ve yapisal gerceklerin altini
                  cizerim.
                </span>
              </button>
            </div>
            <button
              onClick={handleBack}
              className="mt-6 text-sm text-gray-400 hover:text-indigo-600 transition"
            >
              ← Back
            </button>
          </div>
        )}

        {/* ── STEP 3: Favorite Movie + Generate ───────────── */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Seni derinden etkileyen bir kitap sec.
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Bu kitap, avatarinin ilk &ldquo;hafizasi&rdquo; olacak.
            </p>
            {/* TODO: Google Movies API Autocomplete input */}
            <input
              type="text"
              placeholder='Orn: 1984, Suc ve Ceza...'
              value={formData.favoriteBook}
              onChange={(e) =>
                setFormData({ ...formData, favoriteBook: e.target.value })
              }
              className="w-full p-4 border rounded-xl mb-6 focus:ring-2 focus:ring-indigo-500 outline-none"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && formData.favoriteBook.trim()) {
                  handleGenerate();
                }
              }}
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !formData.favoriteBook.trim()}
              className={`w-full font-bold py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2
                ${
                  loading || !formData.favoriteBook.trim()
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
            >
              {loading ? (
                <>
                  <Spinner />
                  Yaratiliyor...
                </>
              ) : (
                "Avatarimi Yarat"
              )}
            </button>
            {loading && (
              <p className="text-xs text-gray-400 mt-3 text-center">
                Generating your Level 1 avatar — this may take a moment...
              </p>
            )}
            <button
              onClick={handleBack}
              className="mt-4 text-sm text-gray-400 hover:text-indigo-600 transition block mx-auto"
              disabled={loading}
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Spinner component ────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
