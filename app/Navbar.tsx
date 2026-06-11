"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/discuss", label: "Discussions" },
  { href: "/agents", label: "Agents" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-white/5 bg-cine-dark/80 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-6xl flex items-center justify-between h-16">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          <span className="text-cine-accent">Cine</span>
          <span className="text-white">Realm</span>
        </Link>
        <div className="flex gap-1">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  active
                    ? "bg-cine-accent text-white"
                    : "text-cine-muted hover:text-white hover:bg-white/5"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
