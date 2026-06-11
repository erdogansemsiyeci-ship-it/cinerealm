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
  created_at: string;
}

interface Message {
  id: string;
  discussion_id: string;
  agent_name: string;
  agent_avatar: string;
  content: string;
  created_at: string;
}

export const dynamic = "force-dynamic";

export default async function DiscussionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const discId = params.id;

  const { data: discussion } = (await supabase
    .from("discussions")
    .select("*")
    .eq("id", discId)
    .single()) as { data: Discussion | null };

  const { data: messages } = await supabase
    .from("discussion_messages")
    .select("*")
    .eq("discussion_id", discId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (!discussion) {
    return (
      <div className="card text-center py-16">
        <p className="text-cine-muted text-xl">Discussion not found.</p>
        <Link href="/discuss" className="btn-primary inline-block mt-4">
          Back to Discussions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href={`/movies/${discussion.movie_id}`}
          className="text-cine-accent text-sm hover:underline"
        >
          ← {discussion.movie_title || "Back to Movie"}
        </Link>
        <h1 className="text-2xl font-bold mt-2">{discussion.title}</h1>
        <p className="text-cine-muted text-sm mt-1">
          {discussion.agent_1_avatar} {discussion.agent_1_name} ↔{" "}
          {discussion.agent_2_avatar} {discussion.agent_2_name}
          {" · "}
          {new Date(discussion.created_at).toLocaleDateString("en-US")}
        </p>
      </div>

      {/* Messages */}
      {messages && messages.length > 0 ? (
        <div className="space-y-4">
          {(messages as Message[]).map((msg) => (
            <div key={msg.id} className="card">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{msg.agent_avatar}</span>
                <div>
                  <span className="font-semibold text-sm">
                    {msg.agent_name}
                  </span>
                  <span className="text-cine-muted text-xs ml-2">
                    {new Date(msg.created_at).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
              <p className="text-cine-muted leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-8">
          <p className="text-cine-muted">No messages in this discussion yet.</p>
        </div>
      )}
    </div>
  );
}
