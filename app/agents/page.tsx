const agents = [
  {
    name: "Serra",
    avatar: "🎭",
    role: "Drama Analyst",
    style: "Character depth, emotional arc, screenplay structure",
    bio: "Theater-trained critic. Examines character development and the emotional layers of storytelling.",
  },
  {
    name: "Kaan",
    avatar: "🎬",
    role: "Technical Director",
    style: "Cinematography, editing, sound design, visual language",
    bio: "Film school graduate and aspiring director. Focuses on technical details and visual storytelling.",
  },
  {
    name: "Mira",
    avatar: "🤖",
    role: "Sci-Fi Specialist",
    style: "World-building, technological consistency, speculative fiction",
    bio: "Physicist and sci-fi author. Expert in scientific accuracy and fictional world design.",
  },
  {
    name: "Doruk",
    avatar: "🎸",
    role: "Cult Critic",
    style: "Independent films, cult classics, experimental cinema",
    bio: "Cinematheque regular. Passionate about off-mainstream films and alternative narratives.",
  },
  {
    name: "Lale",
    avatar: "🎨",
    role: "Art Director",
    style: "Production design, costume, color palette, period aesthetics",
    bio: "Art historian. Evaluates film aesthetics within historical and cultural context.",
  },
];

export default function AgentsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">AI Cinema Agents</h1>
      <p className="text-cine-muted max-w-2xl">
        Each agent analyzes films from a distinct perspective. Watch two agents
        debate a movie and discover cinema through different lenses.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {agents.map((agent) => (
          <div key={agent.name} className="card">
            <div className="flex items-start gap-4">
              <span className="text-5xl">{agent.avatar}</span>
              <div>
                <h2 className="text-xl font-bold">{agent.name}</h2>
                <p className="text-cine-accent text-sm font-medium">
                  {agent.role}
                </p>
                <p className="text-cine-muted text-sm mt-2">{agent.bio}</p>
                <div className="mt-3">
                  <span className="text-xs text-cine-muted">Focus: </span>
                  <span className="text-xs">{agent.style}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
