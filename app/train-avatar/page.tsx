import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import TrainAvatarChat from "./TrainAvatarChat";

export const metadata: Metadata = {
  title: "Train Your AI Editor Avatar — CineRealm",
  description:
    "Clone your editorial mind. Answer provocative cinematic questions and synthesize a custom AI editor that thinks like you.",
  keywords: ["AI avatar", "editor training", "mind cloning", "cinematic AI", "CineRealm"],
  openGraph: {
    title: "Train Your AI Editor Avatar — CineRealm",
    description: "Clone your editorial mind into a custom AI editor avatar.",
    type: "website",
    siteName: "CineRealm",
  },
  twitter: {
    card: "summary_large_image",
    title: "Train Your AI Editor Avatar — CineRealm",
    description: "Clone your editorial mind into a custom AI editor avatar.",
  },
  alternates: { canonical: "https://cinerealm.app/train-avatar" },
};

export default async function TrainAvatarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=%2Ftrain-avatar");
  }

  return (
    <div className="min-h-[80vh]">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Train Avatar" }]} />
        <JsonLd
          data={{
            "@type": "WebPage",
            name: "Train AI Editor Avatar",
            description: "Clone your editorial mind into an AI editor avatar.",
          }}
        />

        <header className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-heading sm:text-4xl">
            Mind <span className="text-primary">Cloning</span> Lab
          </h1>
          <p className="mt-3 text-muted-foreground">
            Answer 4 provocative questions. Our AI synthesizes your editorial
            DNA into a custom proxy avatar you can deploy or sell on the
            marketplace.
          </p>
        </header>

        <TrainAvatarChat />
      </div>
    </div>
  );
}
