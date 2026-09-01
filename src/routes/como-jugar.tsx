import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/como-jugar")({
  head: () => ({
    meta: [
      { title: "Cómo se juega a Friendxit" },
      {
        name: "description",
        content:
          "Reglas de Friendxit: sube tus cartas, da una pista como narrador, vota la carta correcta y suma puntos.",
      },
      { property: "og:title", content: "Cómo se juega a Friendxit" },
      {
        property: "og:description",
        content: "Reglas rápidas del Dixit online con tus propias fotos.",
      },
    ],
  }),
  component: ComoJugar,
});

const steps = [
  {
    title: "1. Sube tus cartas",
    text: "Al entrar en la sala, cada jugador sube desde su galería al menos 6 imágenes. Solo tú ves tu mano.",
  },
  {
    title: "2. El narrador da una pista",
    text: "Cada ronda un jugador es narrador: elige una de sus cartas y escribe una pista (una palabra, una frase, una canción…).",
  },
  {
    title: "3. Todos aportan una carta",
    text: "El resto elige de su mano la carta que mejor encaje con esa pista. Las cartas se mezclan y se muestran boca arriba.",
  },
  {
    title: "4. Votación",
    text: "Todos menos el narrador votan cuál creen que es la carta original.",
  },
  {
    title: "5. Puntos",
    text: "Si aciertan todos o nadie, el narrador se queda a 0 y los demás suman 2. Si no, el narrador y quienes acierten suman 3. Además, cada carta ajena votada da 1 punto a su dueño.",
  },
];

function ComoJugar() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <Link to="/" className="font-display text-lg font-semibold">
        Friend<span className="text-gradient-gold">xit</span>
      </Link>
      <h1 className="mt-8 text-4xl">Cómo se juega</h1>
      <p className="mt-3 text-muted-foreground">
        De 3 a 10 jugadores. La partida dura lo que queráis: cada ronda cambia el narrador.
      </p>
      <ol className="mt-8 space-y-4">
        {steps.map((s) => (
          <li key={s.title} className="surface-panel p-6">
            <h2 className="text-lg text-primary">{s.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
          </li>
        ))}
      </ol>

      <h2 className="mt-12 text-2xl">Dos modos de juego</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="surface-panel p-6">
          <h3 className="text-lg text-primary">Mazo común</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Todos aportan fotos de su galería a un mazo compartido. Al empezar la partida se
            reparten 6 cartas al azar a cada jugador y, al terminar cada ronda, la carta jugada se
            descarta y entra otra nueva del mazo.
          </p>
        </div>
        <div className="surface-panel p-6">
          <h3 className="text-lg text-primary">Cada uno con sus fotos</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Cada jugador juega solo con sus propias imágenes o con un mazo guardado. Ideal si
            queréis usar colecciones personales.
          </p>
        </div>
      </div>

      <Link
        to="/jugar"
        className="mt-10 inline-block rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        Empezar a jugar
      </Link>
    </div>
  );
}
