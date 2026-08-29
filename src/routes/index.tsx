import { createFileRoute, Link } from "@tanstack/react-router";
import { Images, Users, Sparkles, Smartphone } from "lucide-react";
import heroCartas from "@/assets/hero-cartas.jpg";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Metáfora — Dixit online con tus propias fotos" },
      {
        name: "description",
        content:
          "Juega gratis a un Dixit online: cada jugador sube sus cartas desde la galería del móvil y jugáis en tiempo real, de 3 a 10 personas.",
      },
      { property: "og:title", content: "Metáfora — Dixit online con tus propias fotos" },
      {
        property: "og:description",
        content: "Sube tus cartas desde la galería y juega en tiempo real con tus amigos.",
      },
    ],
  }),
  component: Index,
});

const features = [
  {
    icon: Users,
    title: "3 a 10 jugadores",
    text: "Crea una sala, comparte el código y que entre toda la cuadrilla.",
  },
  {
    icon: Images,
    title: "Tus propias cartas",
    text: "Cada jugador sube sus imágenes desde la galería. Mazo único en cada partida.",
  },
  {
    icon: Smartphone,
    title: "Cualquier dispositivo",
    text: "Móvil, tablet u ordenador. Sin instalar nada.",
  },
  {
    icon: Sparkles,
    title: "Puntos automáticos",
    text: "Las reglas y la puntuación se calculan solas ronda tras ronda.",
  },
];

function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-6 sm:flex sm:flex-wrap sm:justify-between">
        <div className="flex min-w-0 items-center">
          <span className="font-display text-xl font-semibold tracking-tight truncate">
            Met<span className="text-gradient-gold">áfora</span>
          </span>
        </div>
        <nav className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2 text-sm">
          <Link to="/como-jugar" className="text-muted-foreground transition hover:text-foreground">
            Cómo se juega
          </Link>
          {user && (
            <Link to="/mazos" className="text-muted-foreground transition hover:text-foreground">
              Mis mazos
            </Link>
          )}
          <Link
            to={user ? "/jugar" : "/auth"}
            className="rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            {user ? "Jugar" : "Entrar"}
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pt-6 pb-16 md:grid-cols-2 md:pt-14">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              Juego de cartas online
            </p>
            <h1 className="mt-4 text-4xl leading-[1.05] md:text-6xl">
              Un <span className="text-gradient-gold">Dixit</span> jugado con las fotos de tu móvil
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground md:text-lg">
              Cada jugador sube sus cartas desde la galería y después empieza la partida: pistas
              imposibles, votaciones y risas, aunque estéis en ciudades distintas.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={user ? "/jugar" : "/auth"}
                className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
              >
                Jugar gratis
              </Link>
              <Link
                to="/como-jugar"
                className="rounded-full border border-border px-6 py-3 font-medium transition hover:bg-secondary"
              >
                Cómo se juega
              </Link>
            </div>
          </div>
          <div className="animate-float">
            <img
              src={heroCartas}
              alt="Cartas ilustradas flotando sobre un paisaje nocturno estrellado"
              width={1600}
              height={1104}
              className="w-full rounded-3xl border border-border shadow-2xl"
            />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="surface-panel p-6">
                <f.icon className="h-6 w-6 text-primary" aria-hidden />
                <h2 className="mt-4 text-lg">{f.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 pb-24 text-center">
          <div className="surface-panel px-6 py-12">
            <h2 className="text-3xl md:text-4xl">Primero las cartas, luego la magia</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Sube al menos seis imágenes desde tu galería al entrar en la sala. Cuando todo el
              mundo esté listo, el anfitrión empieza la partida.
            </p>
            <Link
              to={user ? "/jugar" : "/auth"}
              className="mt-8 inline-block rounded-full bg-primary px-7 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Crear una sala
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        Metáfora — juego inspirado en Dixit, hecho para jugar con amigos.
      </footer>
    </div>
  );
}
