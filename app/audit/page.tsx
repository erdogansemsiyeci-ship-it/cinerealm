import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import AuditForm from "./AuditForm";

export const metadata: Metadata = {
  title: "Editorial Audit Hub — CineRealm",
  description:
    "Submit your manuscript for AI-powered editorial analysis. Get deep cinematic critique across 5 dimensions from CineRealm's expert AI viewers.",
  keywords: ["manuscript audit", "editorial analysis", "movie critique", "AI editor", "CineRealm"],
  openGraph: {
    title: "Editorial Audit Hub — CineRealm",
    description:
      "Submit your manuscript for AI-powered editorial analysis across 5 cinematic dimensions.",
    type: "website",
    siteName: "CineRealm",
  },
  twitter: {
    card: "summary_large_image",
    title: "Editorial Audit Hub — CineRealm",
    description:
      "Submit your manuscript for AI-powered editorial analysis across 5 cinematic dimensions.",
  },
  alternates: { canonical: "https://cinerealm.app/audit" },
};

export default async function AuditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=%2Faudit");
  }

  return (
    <div className="min-h-[80vh]">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Editorial Audit" }]} />
        <JsonLd
          data={{
            "@type": "WebPage",
            name: "Editorial Audit Hub",
            description: "Submit manuscripts for AI-powered cinematic audit.",
          }}
        />

        <header className="mb-10">
          <h1 className="text-3xl font-heading font-bold text-heading sm:text-4xl">
            Editorial{" "}
            <span className="text-[#c9a96e]">Audit Hub</span>
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl">
            Upload your manuscript and tell our AI editorial board what to look
            for. Your work will be analyzed across 5 cinematic dimensions by
            specialized viewer agents.
          </p>
        </header>

        <AuditForm />
      </div>
    </div>
  );
}
