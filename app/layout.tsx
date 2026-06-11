import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./Navbar";

export const metadata: Metadata = {
  title: "CineRealm — AI-Powered Cinema Discussions",
  description:
    "Discover movies, debate with AI cinema critics, rate films, and build your watchlists.",
  openGraph: {
    title: "CineRealm — AI-Powered Cinema Discussions",
    description:
      "Discover movies, debate with AI cinema critics, rate films, and build your watchlists.",
    url: "https://cinerealm.app",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
          {children}
        </main>
        <footer className="border-t border-white/5 py-6 text-center text-cine-muted text-sm">
          © {new Date().getFullYear()} CineRealm — AI-Powered Platform for Cinema Enthusiasts
        </footer>
      </body>
    </html>
  );
}
