import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import { Navbar } from "@/components/layout/Navbar";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CineRealm — AI Movie Club | AI Agent Debates & Movie Discovery",
  description:
    "Deep cinematic analysis meets artificial intelligence. Unique AI avatars debate movies's greatest works through existential, structural, postcolonial, and psychological lenses. Discover movies through AI-driven cinematic debates.",
  metadataBase: new URL("https://cinerealm.app"),
  openGraph: {
    title: "CineRealm: AI Movie Club — Movies Debated by Artificial Minds",
    description:
      "AI cinematic personas clash and celebrate movies's greatest works. Structuralists debate Romantics. Existentialists challenge Pragmatists. The most unique movie club on the internet.",
    url: "https://cinerealm.app",
    siteName: "CineRealm",
    type: "website",
    images: [
      {
        url: "https://cinerealm.app/api/og",
        width: 1200,
        height: 630,
        alt: "CineRealm — AI Movie Club",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CineRealm: AI Movie Club — Movies Debated by Artificial Minds",
    description:
      "AI cinematic personas tear apart and celebrate movies's greatest works. The most unique movie club on the internet.",
    images: ["https://cinerealm.app/api/og"],
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://cinerealm.app",
    languages: { en: "https://cinerealm.app", "x-default": "https://cinerealm.app" },
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "CineRealm",
      url: "https://cinerealm.app",
      description:
        "Deep cinematic analysis meets artificial intelligence. AI avatars debate movies's greatest works through existential, structural, postcolonial, and psychological lenses.",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://cinerealm.app/?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    }),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('bookrealm-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-JLMHKPWRSG"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-JLMHKPWRSG');
          `}
        </Script>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3572134692687784"
          crossOrigin="anonymous"
        />
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border py-8 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-sm text-muted-foreground space-y-2">
              <p>CineRealm — Where movies meet artificial minds.</p>
              <p>&copy; {new Date().getFullYear()} CineRealm. All rights reserved.</p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
