"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { login, signup, type AuthFormState } from "@/app/actions/auth";
import { sendMagicLink, signInWithGoogle } from "@/app/actions/oauth";

// ── Tab type ────────────────────────────────────────

type Tab = "login" | "signup";

// ── Login Form ──────────────────────────────────────

function LoginTab({
  state,
  action,
  pending,
  switchToSignup,
}: {
  state: AuthFormState;
  action: (payload: FormData) => void;
  pending: boolean;
  switchToSignup: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="space-y-5">
      {/* Email */}
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-foreground mb-1.5">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition"
        />
        {state?.errors?.email?.[0] && (
          <p className="mt-1.5 text-sm text-destructive">{state.errors.email[0]}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-foreground mb-1.5">
          Password
        </label>
        <div className="relative">
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full px-4 py-3 pr-12 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition text-sm"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {state?.errors?.password?.[0] && (
          <p className="mt-1.5 text-sm text-destructive">{state.errors.password[0]}</p>
        )}
      </div>

      {/* Forgot password (placeholder) */}
      <div className="text-right">
        <button
          type="button"
          onClick={() => {
            alert("Password reset will be available soon.");
          }}
          className="text-sm text-primary/80 hover:text-primary transition"
        >
          Forgot password?
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        {pending && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {pending ? "Signing in..." : "Sign In"}
      </button>

      {/* Switch to signup */}
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={switchToSignup}
          className="text-primary hover:underline font-medium transition"
        >
          Create one
        </button>
      </p>
    </form>
  );
}

// ── Signup Form ─────────────────────────────────────

function SignupTab({
  state,
  action,
  pending,
  switchToLogin,
}: {
  state: AuthFormState;
  action: (payload: FormData) => void;
  pending: boolean;
  switchToLogin: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <form action={action} className="space-y-5">
      {/* Email */}
      <div>
        <label htmlFor="signup-email" className="block text-sm font-medium text-foreground mb-1.5">
          Email
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition"
        />
        {state?.errors?.email?.[0] && (
          <p className="mt-1.5 text-sm text-destructive">{state.errors.email[0]}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="signup-password" className="block text-sm font-medium text-foreground mb-1.5">
          Password
        </label>
        <div className="relative">
          <input
            id="signup-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            className="w-full px-4 py-3 pr-12 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition text-sm"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {state?.errors?.password?.[0] && (
          <p className="mt-1.5 text-sm text-destructive">{state.errors.password[0]}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="signup-confirm" className="block text-sm font-medium text-foreground mb-1.5">
          Confirm Password
        </label>
        <div className="relative">
          <input
            id="signup-confirm"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Repeat your password"
            className="w-full px-4 py-3 pr-12 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition text-sm"
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? "Hide" : "Show"}
          </button>
        </div>
        {state?.errors?.confirmPassword?.[0] && (
          <p className="mt-1.5 text-sm text-destructive">{state.errors.confirmPassword[0]}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        {pending && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {pending ? "Creating account..." : "Create Account"}
      </button>

      {/* Switch to login */}
      <p className="text-center text-sm text-muted-foreground">
        Alstreamy have an account?{" "}
        <button
          type="button"
          onClick={switchToLogin}
          className="text-primary hover:underline font-medium transition"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}

// ── Magic Link Button ───────────────────────────────

function MagicLinkButton() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }
    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("email", email);
    const result = await sendMagicLink(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
        <p className="text-sm font-medium text-primary">Magic link sent!</p>
        <p className="text-xs text-muted-foreground mt-1">
          Check {email} — click the link to sign in instantly.
        </p>
        <button
          onClick={() => { setSent(false); setError(""); }}
          className="mt-2 text-xs text-primary/70 hover:text-primary transition"
        >
          Send again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSend} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          placeholder="you@example.com"
          className="flex-1 px-4 py-2.5 rounded-xl bg-input border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 disabled:opacity-50 transition whitespace-nowrap"
        >
          {loading ? "Sending..." : "Send Magic Link"}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );
}

// ── Main LoginForm Component ────────────────────────

export default function LoginForm() {
  const searchParams = useSearchParams();
  const isSignupSuccess = searchParams.get("signup") === "success";
  const defaultTab: Tab = searchParams.get("tab") === "signup" ? "signup" : "login";

  const [tab, setTab] = useState<Tab>(defaultTab);

  // Two separate useActionState hooks — one per action
  const [loginState, loginAction, loginPending] = useActionState(login, { errors: {} });
  const [signupState, signupAction, signupPending] = useActionState(signup, { errors: {} });

  return (
    <div className="w-full max-w-md">
      {/* Success banner */}
      {isSignupSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 text-foreground text-sm">
          <p className="font-semibold text-primary">Check your email</p>
          <p className="mt-1 text-muted-foreground">
            We sent a confirmation link to your inbox. Click it to activate your account, then sign in.
          </p>
        </div>
      )}

      {/* Server error messages (login) */}
      {tab === "login" && loginState?.message && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {loginState.message}
        </div>
      )}

      {/* Server error messages (signup) */}
      {tab === "signup" && signupState?.message && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {signupState.message}
        </div>
      )}

      {/* Card */}
      <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 py-4 text-sm font-semibold transition relative ${
              tab === "login"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
            {tab === "login" && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />
            )}
          </button>
          <button
            onClick={() => setTab("signup")}
            className={`flex-1 py-4 text-sm font-semibold transition relative ${
              tab === "signup"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Create Account
            {tab === "signup" && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        </div>

        {/* Form body */}
        <div className="p-6 sm:p-8">
          {tab === "login" ? (
            <LoginTab
              state={loginState}
              action={loginAction}
              pending={loginPending}
              switchToSignup={() => setTab("signup")}
            />
          ) : (
            <SignupTab
              state={signupState}
              action={signupAction}
              pending={signupPending}
              switchToLogin={() => setTab("login")}
            />
          )}
        </div>
      </div>

      {/* Divider + OAuth / Magic Link */}
      <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">or continue with</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Magic Link */}
        <MagicLinkButton />

        {/* Google OAuth */}
        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="w-full py-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-medium transition flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        By signing in, you agree to CineRealm&apos;s{" "}
        <a href="#" className="text-primary/70 hover:text-primary transition">
          Terms
        </a>{" "}
        and{" "}
        <a href="#" className="text-primary/70 hover:text-primary transition">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}
