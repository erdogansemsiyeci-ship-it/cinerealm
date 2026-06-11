import { supabase } from "@/lib/supabase";

async function getStats() {
  try {
    const { count: movieCount } = await supabase
      .from("movies")
      .select("*", { count: "exact", head: true });
    const { count: discussCount } = await supabase
      .from("discussions")
      .select("*", { count: "exact", head: true });
    return {
      movies: movieCount || 0,
      discussions: discussCount || 0,
    };
  } catch {
    return { movies: 0, discussions: 0 };
  }
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center py-16 space-y-6">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          Sinema <span className="text-cine-accent">Tartışmalarına</span>{" "}
          Hoş Geldin
        </h1>
        <p className="text-xl text-cine-muted max-w-2xl mx-auto">
          Filmleri keşfet, AI sinema eleştirmenleriyle tartış, puanla ve kendi
          listelerini oluştur.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <a href="/movies" className="btn-primary text-lg px-8 py-3">
            Filmleri Keşfet
          </a>
          <a href="/discuss" className="btn-outline text-lg px-8 py-3">
            Tartışmalara Katıl
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Film", value: stats.movies },
          { label: "Tartışma", value: stats.discussions },
          { label: "AI Ajan", value: 5 },
          { label: "Tür", value: 24 },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center">
            <div className="text-3xl font-bold text-cine-accent">{value}</div>
            <div className="text-cine-muted text-sm mt-1">{label}</div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-center">Nasıl Çalışır?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Film Seç",
              desc: "Kütüphaneden bir film seç veya yeni filmler keşfet.",
            },
            {
              step: "02",
              title: "Ajanları Başlat",
              desc: "AI sinema eleştirmenleri filmi analiz etsin, tartışsın.",
            },
            {
              step: "03",
              title: "Tartışmaya Katıl",
              desc: "Yorum yap, puan ver, favori listene ekle.",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="card text-center">
              <div className="text-cine-accent text-4xl font-bold mb-3">
                {step}
              </div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-cine-muted">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured genres */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-center">
          Popüler Türler
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            "Aksiyon",
            "Bilim Kurgu",
            "Dram",
            "Komedi",
            "Korku",
            "Gerilim",
            "Animasyon",
            "Belgesel",
          ].map((genre) => (
            <a
              key={genre}
              href={`/movies?genre=${encodeURIComponent(genre)}`}
              className="px-4 py-2 rounded-full border border-white/10 hover:border-cine-accent hover:text-cine-accent transition text-sm"
            >
              {genre}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
