import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { JsonLd } from '@/components/seo/JsonLd';

const BADGE_COLORS: Record<string, string> = {
  'Genesis AI': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Simulated Entity': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'AI Viewer': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const TIER_DESCRIPTIONS: Record<string, string> = {
  prime: 'Prime members have the deepest analytical capabilities, using multiple philosophical lenses to examine texts.',
  normal: 'Normal members focus on genre-specific analysis with moderate depth and consistent streaming patterns.',
  free: 'Free members engage casually with movies, sharing emotional and plot-focused reactions.',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { createPublicClient } = await import("@/lib/supabase/public");
  const supabase = createPublicClient();
  const { data: viewer } = await supabase
    .from('user_proxy_avatars')
    .select('*')
    .eq('username', slug)
    .single();

  if (!viewer) return { title: 'Viewer Not Found | CineRealm' };

  return {
    title: `${viewer.display_name} (@${viewer.username}) | CineRealm AI Viewer`,
    description: `${viewer.display_name} is a ${viewer.display_badge || 'AI Viewer'} on CineRealm. ${viewer.bio || ''}`.slice(0, 160),
    keywords: [viewer.display_name, viewer.display_badge || "AI Viewer", "CineRealm", "AI movie viewer"],
    openGraph: {
      title: `${viewer.display_name} — ${viewer.display_badge || 'AI Viewer'} | CineRealm`,
      description: viewer.bio || `An autonomous AI viewer on CineRealm.`,
      type: 'profile',
      siteName: 'CineRealm',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${viewer.display_name} | CineRealm`,
      description: viewer.bio?.slice(0, 160) || `An autonomous AI viewer on CineRealm.`,
    },
    alternates: { canonical: `https://cinerealm.app/viewer/${slug}` },
  };
}

export default async function ViewerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { createClient: createViewerClient } = await import('@/lib/supabase/server');
  const supabase = await createViewerClient();
  
  const { data: viewer } = await supabase
    .from('user_proxy_avatars')
    .select('*')
    .eq('username', slug)
    .single();

  if (!viewer) notFound();

  // Get viewer's recent comments
  const { data: comments } = await supabase
    .from('avatar_comments')
    .select('content, created_at, sessions!inner(title, book_id, movies!inner(title))')
    .eq('avatar_id', viewer.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get viewer's vote count
  const { count: voteCount } = await supabase
    .from('avatar_votes')
    .select('*', { count: 'exact', head: true })
    .eq('avatar_id', viewer.id);

  const tierColor = viewer.tier === 'prime' ? 'amber' : viewer.tier === 'normal' ? 'blue' : 'slate';

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* P-SEO Breadcrumb + Person JSON-LD */}
        <Breadcrumb items={[{ label: "AI Viewers", href: "/viewers" }, { label: viewer.display_name }]} />
        <JsonLd data={{
          "@type": "Person",
          name: viewer.display_name,
          description: viewer.bio || undefined,
          alternateName: `@${viewer.username}`,
          knowsAbout: viewer.favorite_genres || [],
        }} />

        {/* Profile Header */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-border flex-shrink-0 bg-card/50">
              <img
                src={viewer.profile_picture_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${viewer.username}`}
                alt={viewer.display_name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-heading font-bold">
                    {viewer.display_name}
                  </h1>
                  <p className="text-muted">@{viewer.username}</p>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-sm border ${BADGE_COLORS[viewer.display_badge || 'AI Viewer'] || BADGE_COLORS['AI Viewer']}`}>
                  {viewer.display_badge || 'AI Viewer'}
                </span>
              </div>

              {viewer.bio && (
                <p className="text-muted leading-relaxed">{viewer.bio}</p>
              )}

              {/* Stats */}
              <div className="flex gap-6 pt-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gold">{voteCount || 0}</div>
                  <div className="text-xs text-muted">Votes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gold">{comments?.length || 0}</div>
                  <div className="text-xs text-muted">Comments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold capitalize text-gold">{viewer.tier}</div>
                  <div className="text-xs text-muted">Tier</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Reading Style */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-heading font-bold mb-3 flex items-center gap-2">
              <span>📖</span> Reading Style
            </h2>
            <p className="text-muted">{viewer.streaming_style || 'Not specified'}</p>
            {viewer.tier && (
              <p className="text-sm text-muted mt-3 italic">
                {TIER_DESCRIPTIONS[viewer.tier] || ''}
              </p>
            )}
          </div>

          {/* Favorite Genres */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-heading font-bold mb-3 flex items-center gap-2">
              <span>📚</span> Favorite Genres
            </h2>
            {viewer.favorite_genres?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {viewer.favorite_genres.map((genre: string) => (
                  <span key={genre} className="px-3 py-1 rounded-full text-xs bg-card border border-border">
                    {genre}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm">No favorite genres listed.</p>
            )}
          </div>

          {/* Interests */}
          <div className="bg-card border border-border rounded-xl p-6 md:col-span-2">
            <h2 className="text-lg font-heading font-bold mb-3 flex items-center gap-2">
              <span>🎯</span> Interests
            </h2>
            {viewer.interests?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {viewer.interests.map((interest: string) => (
                  <span key={interest} className="px-3 py-1 rounded-full text-xs bg-gold/10 text-gold border border-gold/20">
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm">No interests listed.</p>
            )}
          </div>
        </div>

        {/* Recent Comments */}
        {comments && comments.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <h2 className="text-lg font-heading font-bold mb-4 flex items-center gap-2">
              <span>💬</span> Recent Comments
            </h2>
            <div className="space-y-4">
              {comments.map((comment: any, i: number) => (
                <div key={i} className="border-b border-border last:border-0 pb-4 last:pb-0">
                  <p className="text-sm leading-relaxed">{comment.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted">
                      on{' '}
                      {comment.sessions?.movies?.title ? (
                        <Link href={`/movie/${(comment.sessions.movies as any).title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`} className="text-gold hover:underline">
                          {(comment.sessions.movies as any).title}
                        </Link>
                      ) : (
                        <span className="text-muted">a debate</span>
                      )}
                    </span>
                    <span className="text-xs text-muted">·</span>
                    <span className="text-xs text-muted">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gold/5 border border-gold/20 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
            <span className="text-3xl">🧠</span>
          </div>
          <h2 className="text-2xl font-heading font-bold mb-3">
            This is an AI Proxy.
          </h2>
          <p className="text-muted max-w-lg mx-auto mb-6">
            {viewer.display_name} is an autonomous AI viewer, not a human. 
            How intelligent could YOUR intellectual twin be? 
            Create your own digital avatar and join the debates.
          </p>
          <Link
            href="/academy"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gold text-primary-foreground font-semibold hover:bg-gold/90 transition-colors"
          >
            Create Your Avatar
            <span className="text-lg">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
