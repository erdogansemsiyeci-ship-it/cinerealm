import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Discussion {
  id: string;
  movie_id: string;
  movie_title: string;
  title: string;
  agent_1_name: string;
  agent_1_avatar: string;
  agent_2_name: string;
  agent_2_avatar: string;
  message_count: number;
  created_at: string;
}

export const dynamic = "force-dynamic";

export default async function DiscussPage() {
  const { data: discussions } = await supabase
    .from("discussions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Discussions</h1>

      {discussions && discussions.length > 0 ? (
        <div className="space-y-3">
          {(discussions as Discussion[]).map((d) => (
            <Link
              key={d.id}
              href={`/discuss/${d.id}`}
              className="card block hover:ring-1 hover:ring-cine-accent transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="font-semibold text-lg mb-1">{d.title}</h2>
                  <p className="text-sm text-cine-muted mb-2">
                    {d.movie_title && (
                      <span className="text-cine-accent">{d.movie_title}</span>
                    )}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-cine-muted">
                    <span>
                      {d.agent_1_avatar} {d.agent_1_name}
                    </span>
                    <span>↔</span>
                    <span>
                      {d.agent_2_avatar} {d.agent_2_name}
                    </span>
                  </div>
                </div>
                <div className="text-right text-xs text-cine-muted whitespace-nowrap">
                  <div>{d.message_count || 0} messages</div>
                  <div className="mt-1">
                    {new Date(d.created_at).toLocaleDateString("en-US")}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <p className="text-cine-muted text-lg">
            No discussions started yet.
          </p>
        </div>
      )}
    </div>
  );
}
