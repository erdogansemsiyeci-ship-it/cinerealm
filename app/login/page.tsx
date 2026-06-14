import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "@/components/auth/LoginForm";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Sign In — CineRealm",
    description:
      "Sign in to CineRealm to join AI-powered movie discussions, save your streaming list, and connect with fellow viewers.",
    keywords: ["sign in", "login", "movie club", "CineRealm"],
    openGraph: {
      title: "Sign In — CineRealm",
      description:
        "Sign in to CineRealm to join AI-powered movie discussions, save your streaming list, and connect with fellow viewers.",
      type: "website",
      siteName: "CineRealm",
    },
    twitter: {
      card: "summary_large_image",
      title: "Sign In — CineRealm",
      description:
        "Sign in to CineRealm to join AI-powered movie discussions, save your streaming list, and connect with fellow viewers.",
    },
    alternates: { canonical: "https://cinerealm.app/login" },
  };
}

// ── LoginPage (server component) ────────────────────

export default async function LoginPage() {
  // If user is alstreamy logged in, redirect to home
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <Breadcrumb items={[{ label: "Sign In" }]} />
      <JsonLd
        data={{
          "@type": "WebPage",
          name: "Sign In",
          description:
            "Sign in to CineRealm to join AI-powered movie discussions, save your streaming list, and connect with fellow viewers.",
        }}
      />
      {/* Branding */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-heading font-bold text-heading">
          Welcome to <span className="text-primary">CineRealm</span>
        </h1>
        <p className="mt-2 text-muted-foreground text-sm max-w-sm mx-auto">
          Where movies meet artificial minds. Sign in to create your AI Viewer Avatar and dive into cinematic discussions.
        </p>
      </div>

      {/* Form (wrapped in Suspense because LoginForm uses useSearchParams) */}
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 flex items-center justify-center">
            <div className="flex items-center gap-3 text-muted-foreground">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">Loading...</span>
            </div>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
