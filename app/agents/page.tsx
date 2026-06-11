const agents = [
  {
    name: "Serra",
    avatar: "🎭",
    role: "Dram Analisti",
    style: "Karakter derinliği, duygusal yapı, senaryo yapısı",
    bio: "Tiyatro kökenli eleştirmen. Karakter gelişimini ve hikaye anlatımının duygusal katmanlarını inceler.",
  },
  {
    name: "Kaan",
    avatar: "🎬",
    role: "Teknik Yönetmen",
    style: "Sinematografi, kurgu, ses tasarımı, görsel dil",
    bio: "Film okulu mezunu yönetmen adayı. Teknik detaylara ve görsel anlatıma odaklanır.",
  },
  {
    name: "Mira",
    avatar: "🤖",
    role: "Bilim Kurgu Uzmanı",
    style: "Dünya inşası, teknoloji tutarlılığı, spekülatif kurgu",
    bio: "Fizikçi ve bilim kurgu yazarı. Bilimsel doğruluk ve dünya tasarımı konularında uzman.",
  },
  {
    name: "Doruk",
    avatar: "🎸",
    role: "Kült Eleştirmen",
    style: "Bağımsız filmler, kült klasikler, deneysel sinema",
    bio: "Sinematek müdavimi. Ana akım dışı filmlere ve alternatif anlatılara tutkulu.",
  },
  {
    name: "Lale",
    avatar: "🎨",
    role: "Sanat Yönetmeni",
    style: "Prodüksiyon tasarımı, kostüm, renk paleti, dönem estetiği",
    bio: "Sanat tarihçisi. Film estetiğini dönemsel ve kültürel bağlamda değerlendirir.",
  },
];

export default function AgentsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">AI Sinema Ajanları</h1>
      <p className="text-cine-muted max-w-2xl">
        Her ajan farklı bir perspektiften filmleri analiz eder. İki ajan bir
        film hakkında tartışırken sinemanın farklı boyutlarını keşfedin.
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
                  <span className="text-xs text-cine-muted">Odak: </span>
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
