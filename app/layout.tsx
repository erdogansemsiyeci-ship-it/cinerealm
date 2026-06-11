import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./Navbar";

export const metadata: Metadata = {
  title: "CineRealm — Sinema Tartışma Platformu",
  description:
    "Filmleri keşfet, AI sinema ajanlarıyla tartış, puanla, listeler oluştur.",
  openGraph: {
    title: "CineRealm — Sinema Tartışma Platformu",
    description:
      "Filmleri keşfet, AI sinema ajanlarıyla tartış, puanla, listeler oluştur.",
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
    <html lang="tr">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
          {children}
        </main>
        <footer className="border-t border-white/5 py-6 text-center text-cine-muted text-sm">
          © {new Date().getFullYear()} CineRealm — Sinema Tutkunları için AI Destekli Platform
        </footer>
      </body>
    </html>
  );
}
