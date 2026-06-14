import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Database Mutations — CineRealm Dashboard",
    description:
      "Manage CineRealm database mutations. Track recent changes, schema updates, and data integrity checks.",
    keywords: ["database", "mutations", "admin", "CineRealm"],
    openGraph: {
      title: "Database Mutations — CineRealm Dashboard",
      description:
        "Manage CineRealm database mutations. Track recent changes, schema updates, and data integrity checks.",
      type: "website",
      siteName: "CineRealm",
    },
    twitter: {
      card: "summary_large_image",
      title: "Database Mutations — CineRealm Dashboard",
      description:
        "Manage CineRealm database mutations. Track recent changes, schema updates, and data integrity checks.",
    },
    alternates: { canonical: "https://cinerealm.app/dashboard/mutations" },
  };
}

export default function MutationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
