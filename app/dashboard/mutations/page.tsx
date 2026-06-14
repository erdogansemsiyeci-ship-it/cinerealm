"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Breadcrumb } from "@/components/seo/Breadcrumb"
import { JsonLd } from "@/components/seo/JsonLd"
type Mutation = {
  id: string
  mutation_type: string
  title: string
  description: string
  status: string
  agent?: { display_name: string; streaming_lens: string } | null
}

export default function MutationsPage() {
  const [mutations, setMutations] = useState<Mutation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/mutations")
      .then(r => r.json())
      .then(data => { setMutations(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleAction(id: string, action: "approved" | "rejected") {
    await fetch("/api/mutations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: action }),
    })
    setMutations(prev =>
      prev.map(m => (m.id === id ? { ...m, status: action } : m))
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Mutations" },
          ]}
        />
        <JsonLd
          data={{
            "@type": "WebPage",
            name: "Database Mutations",
            description:
              "Manage CineRealm database mutations. Track recent changes, schema updates, and data integrity checks.",
          }}
        />
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-muted hover:text-gold transition-colors text-sm">
            ← Dashboard
          </Link>
          <span className="text-muted/40">/</span>
          <span className="text-sm text-muted">Avatar Evolution</span>
        </div>

        <h1 className="font-heading text-5xl md:text-6xl text-foreground mb-4">
          Avatar <span className="text-gold">Evolution</span>
        </h1>
        <p className="text-muted text-lg mb-12">
          Review the evolutionary shifts your AI avatars experienced during movie discussions.
        </p>

        {loading && (
          <div className="text-center py-20 text-muted">Loading mutations...</div>
        )}

        {!loading && mutations.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🧬</div>
            <p className="text-xl text-muted">No pending evolutions yet.</p>
            <p className="text-sm text-muted/60 mt-2">
              Avatars evolve when they encounter powerful arguments that challenge their core beliefs.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {mutations.map(m => (
            <div key={m.id} className="p-6 rounded-xl bg-card border border-gold/20 hover:border-gold/40 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-mono ${
                      m.status === "approved" ? "bg-green-500/10 text-green-400" :
                      m.status === "rejected" ? "bg-red-500/10 text-red-400" :
                      "bg-yellow-500/10 text-yellow-400"
                    }`}>
                      {m.status}
                    </span>
                    <span className="text-xs text-muted capitalize">{m.mutation_type.replace(/_/g, " ")}</span>
                  </div>
                  <h3 className="font-heading text-xl text-foreground mb-1">{m.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{m.description}</p>
                  {m.agent && (
                    <div className="flex items-center gap-2 mt-3">
                      <Link href={`/agent/${m.agent.display_name.toLowerCase().replace(/\s+/g, "-").replace(/['']/g, "")}`} className="text-sm text-gold hover:underline">
                        {m.agent.display_name}
                      </Link>
                      <span className="text-muted/40">·</span>
                      <span className="text-xs text-muted">{m.agent.streaming_lens}</span>
                    </div>
                  )}
                  {m.status === "pending" && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleAction(m.id, "approved")}
                        className="px-4 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/20 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(m.id, "rejected")}
                        className="px-4 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-xl bg-card/50 border border-border">
          <h2 className="font-heading text-2xl text-foreground mb-4">How Evolution Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-2xl mb-2">🔍</div>
              <h3 className="font-medium text-foreground mb-1">1. Detection</h3>
              <p className="text-sm text-muted">After each discussion, the Epiphany Engine analyzes the transcript to detect if an avatar's core beliefs were genuinely challenged.</p>
            </div>
            <div>
              <div className="text-2xl mb-2">📋</div>
              <h3 className="font-medium text-foreground mb-1">2. Proposal</h3>
              <p className="text-sm text-muted">A mutation proposal is generated in human-streamable language, explaining exactly what changed and why.</p>
            </div>
            <div>
              <div className="text-2xl mb-2">🧬</div>
              <h3 className="font-medium text-foreground mb-1">3. Integration</h3>
              <p className="text-sm text-muted">Once approved, the epiphany is embedded in vector memory and injected into all future discussions as context.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
