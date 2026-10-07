import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/como-jugar")({
  head: () => ({
    meta: [
      { title: "Cómo se juega a Friendxit" },
      {
        name: "description",
        content:
          "Reglas de Friendxit: sube tus fotos, da una pista como narrador, vota la carta correcta y suma puntos.",
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
    title: "Sube tus fotos",
    text: "Al entrar en la sala, cada jugador sube al menos 6 imágenes de su galería. Solo tú ves tu mano: los demás no saben con qué juegas.",
  },
  {
    title: "El narrador da una pista",
    text: "Cada ronda uno es narrador: elige una de sus cartas y escribe una pista (una palabra, una frase, una canción…). Que no sea ni obvia ni imposible.",
  },
  {
    title: "Todos aportan una carta",
    text: "El resto busca en su mano la carta que mejor encaje con la pista y la echa al montón. Se mezclan y se muestran boca arriba.",
  },
  {
    title: "Votación",
    text: "Todos menos el narrador votan cuál creen que era la carta original. Aquí es donde la gente pica y donde está la gracia.",
  },
  {
    title: "Puntos",
    text: "Si aciertan todos o no acierta nadie, el narrador se queda a 0 y los demás suman 2. Si no, narrador y acertantes suman 3. Y cada voto que reciba tu carta te da 1 punto.",
  },
];

const notes = [
  "El reloj va solo: si al narrador se le acaba el tiempo, su pista se completa automáticamente y pierde 1 punto.",
  "Quien no llega a votar pierde 1 punto. No te despistes con el móvil en la mano.",
];

function ComoJugar() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <Link to="/" className="font-display text-xl font-extrabold tracking-tight">
        Friend<span className="text-gradient-gold">xit</span>
      </Link>

      <span className="mt-8 inline-block rotate-[-1.5deg] rounded-full border-2 border-ink bg-accent px-4 py-1.5 text-[11px] font-extrabold tracking-[0.18em] text-accent-foreground uppercase">
        Reglas rápidas
      </span>
      <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">Cómo se juega</h1>
      <p className="mt-3 max-w-xl text-lg text-muted-foreground">
        De 3 a 10 jugadores. La partida dura lo que queráis y cada ronda cambia el narrador, así que
        todos pasáis por el mismo apuro.
      </p>

      <ol className="mt-10 space-y-5">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="surface-panel relative grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 p-5 sm:p-6"
            style={{ rotate: i % 2 ? "0.4deg" : "-0.4deg" }}
          >
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-accent font-display text-xl font-extrabold text-accent-foreground"
            >
              {i + 1}
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-primary">{s.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-2xl border-2 border-dashed border-ink/35 bg-card/60 p-5">
        <h2 className="font-display text-lg font-extrabold">Lo del reloj</h2>
        <ul className="mt-3 space-y-2">
          {notes.map((n) => (
            <li key={n} className="flex gap-3 text-sm text-muted-foreground">
              <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
              {n}
            </li>
          ))}
        </ul>
      </div>

      <h2 className="mt-12 text-3xl font-extrabold">Dos formas de montar el mazo</h2>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="surface-panel p-6" style={{ rotate: "-0.6deg" }}>
          <h3 className="text-xl font-extrabold text-secondary">Mazo común</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Todos sueltan fotos en un mismo montón. Al empezar se reparten 6 cartas al azar a cada
            jugador y, al terminar la ronda, la carta jugada se descarta y entra otra nueva. Es el
            modo más caótico: acabas jugando con la foto del gato de alguien que no conoces.
          </p>
        </div>
        <div className="surface-panel p-6" style={{ rotate: "0.6deg" }}>
          <h3 className="text-xl font-extrabold text-secondary">Cada uno con sus fotos</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Cada jugador juega solo con sus imágenes o con un mazo guardado de antes. Más de
            confianza: aquí sí reconoces de dónde salen las cartas.
          </p>
        </div>
      </div>

      <Link
        to="/jugar"
        className="mt-10 inline-block rounded-full border-2 border-ink bg-primary px-8 py-4 text-lg font-extrabold text-primary-foreground shadow-ink transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
      >
        Montar una partida
      </Link>
    </div>
  );
}
