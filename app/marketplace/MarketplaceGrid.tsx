"use client";

import { useState } from "react";

// ── Types ─────────────────────────────────────────────

interface EliteAgent {
  id: string;
  name: string;
  title: string;
  price: number;
  rating: number;
  reviews: number;
  description: string;
  lens: string;
}

interface ProxyAvatar {
  id: string;
  avatar_name: string;
  avatar_title: string;
  base_price: number;
  dynamic_price: number;
  rating: number;
  total_hires: number;
  created_at: string;
}

// ── Star rendering ────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  const full = Math.min(5, Math.floor(rating));
  const half = rating - full >= 0.5 && full < 5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <span className="text-[#c9a96e] text-sm">
      {"★".repeat(full)}
      {half && "½"}
      {"☆".repeat(empty)}
    </span>
  );
}

// ── Elite Agent Card ──────────────────────────────────

function EliteCard({ agent }: { agent: EliteAgent }) {
  return (
    <div className="bg-card border border-[#c9a96e]/20 rounded-2xl p-5 hover:border-[#c9a96e]/40 transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c9a96e]/10 text-[#c9a96e] border border-[#c9a96e]/20 font-medium">
              ELITE
            </span>
            <span className="text-[10px] text-muted-foreground">{agent.lens}</span>
          </div>
          <h3 className="text-lg font-heading font-bold text-heading group-hover:text-[#c9a96e] transition-colors">
            {agent.name}
          </h3>
          <p className="text-sm text-muted-foreground">{agent.title}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end">
            <Stars rating={agent.rating} />
            <span className="text-xs text-muted-foreground ml-1">{agent.rating}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">{agent.reviews} reviews</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">
        {agent.description}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-heading">
          {agent.price}{" "}
          <span className="text-xs text-muted-foreground font-normal">credits</span>
        </span>
        <button className="px-4 py-2 rounded-xl bg-[#c9a96e] text-[#0f0f0f] text-sm font-semibold hover:bg-[#b8944f] transition">
          Hire
        </button>
      </div>
    </div>
  );
}

// ── Proxy Avatar Card ─────────────────────────────────

function ProxyCard({ avatar }: { avatar: ProxyAvatar }) {
  const date = new Date(avatar.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
              PROXY
            </span>
            <span className="text-[10px] text-muted-foreground">{date}</span>
          </div>
          <h3 className="text-lg font-heading font-bold text-heading group-hover:text-primary transition-colors">
            {avatar.avatar_name}
          </h3>
          <p className="text-sm text-muted-foreground">{avatar.avatar_title}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end">
            <Stars rating={avatar.rating} />
            <span className="text-xs text-muted-foreground ml-1">{avatar.rating.toFixed(1)}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">{avatar.total_reviews} reviews</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-4 italic">
        Community-trained editorial avatar. {avatar.total_hires} hires
      </p>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-lg font-bold text-heading">
            {avatar.dynamic_price}{" "}
            <span className="text-xs text-muted-foreground font-normal">credits</span>
          </span>
          {avatar.dynamic_price !== avatar.base_price && (
            <span className="ml-1.5 text-[10px] text-[#34d399]">
              ↑{Math.round((avatar.dynamic_price / avatar.base_price - 1) * 100)}%
            </span>
          )}
        </div>
        <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition">
          Hire
        </button>
      </div>
    </div>
  );
}

// ── Main Grid ─────────────────────────────────────────

interface Props {
  eliteAgents: EliteAgent[];
  proxyAvatars: ProxyAvatar[];
}

export default function MarketplaceGrid({ eliteAgents, proxyAvatars }: Props) {
  const [sort, setSort] = useState<"rating" | "price_asc" | "popular" | "newest">("rating");
  const [filter, setFilter] = useState<"all" | "elite" | "proxy">("all");

  const sortedElite = [...eliteAgents].sort((a, b) => {
    if (sort === "rating") return b.rating - a.rating;
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "popular") return b.reviews - a.reviews;
    return b.price - a.price;
  });

  const sortedProxy = [...proxyAvatars].sort((a, b) => {
    if (sort === "rating") return b.rating - a.rating;
    if (sort === "price_asc") return a.dynamic_price - b.dynamic_price;
    if (sort === "popular") return b.total_hires - a.total_hires;
    if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return b.dynamic_price - a.dynamic_price;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex rounded-xl bg-muted p-1">
          {(["all", "elite", "proxy"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === f
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All Editors" : f === "elite" ? "Elite" : "Proxy"}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="px-3 py-1.5 rounded-lg bg-muted text-xs text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="rating">Highest Rated</option>
          <option value="popular">Most Popular</option>
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low → High</option>
        </select>

        <span className="text-xs text-muted-foreground ml-auto">
          {eliteAgents.length + proxyAvatars.length} editors
        </span>
      </div>

      {/* Elite Section */}
      {(filter === "all" || filter === "elite") && sortedElite.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            CineRealm Elite Editors
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedElite.map((agent) => (
              <EliteCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      )}

      {/* Proxy Section */}
      {(filter === "all" || filter === "proxy") && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Community Proxy Avatars
          </h2>
          {sortedProxy.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center">
              <p className="text-4xl mb-3">🧬</p>
              <p className="text-muted-foreground">No proxy avatars yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Be the first to clone your editorial mind.
              </p>
              <a
                href="/train-avatar"
                className="inline-block mt-4 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition"
              >
                Train Your Avatar →
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedProxy.map((avatar) => (
                <ProxyCard key={avatar.id} avatar={avatar} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
