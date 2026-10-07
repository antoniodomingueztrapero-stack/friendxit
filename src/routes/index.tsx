import { createFileRoute, Link } from "@tanstack/react-router";
import heroLiada from "@/assets/portada-liada.jpg";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Friendxit — Dixit online con las fotos de tu galería" },
      {
        name: "description",
        content:
          "Juega gratis a un Dixit online: cada jugador sube sus fotos, uno lanza una pista imposible y los demás intentan colar su carta. De 3 a 10 personas, sin instalar nada.",
      },
      { property: "og:title", content: "Friendxit — Dixit online con las fotos de tu galería" },
      {
        property: "og:description",
        content:
          "Sube tus fotos, suelta pistas imposibles y vota. El juego de cartas donde tu galería es el mazo.",
      },
    ],
  }),
  component: Index,
});

/** Recorte de un trozo de la ilustración, para usarlo como "foto" dentro de una carta. */
function Crop({
  x,
  y,
  w,
  h,
  label,
  className = "",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  className?: string;
}) {
  const NAT_W = 1376;
  const NAT_H = 768;

  return (
    <div
      role="img"
      aria-label={label}
      className={className}
      style={{
        backgroundImage: `url(${heroLiada})`,
        backgroundSize: `${(NAT_W / w) * 100}% ${(NAT_H / h) * 100}%`,
        backgroundPosition: `${(x / (NAT_W - w)) * 100}% ${(y / (NAT_H - h)) * 100}%`,
        backgroundRepeat: "no-repeat",
        aspectRatio: `${w} / ${h}`,
      }}
    />
  );
}

const steps = [
  {
    n: "1",
    title: "Alguien suelta una pista",
    text: "Una palabra, una frase o el estribillo de una canción. Cuanto más raro, mejor.",
    crop: { x: 930, y: 80, w: 200, h: 160, label: "Una mano sosteniendo una foto en alto" },
    tilt: "-3deg",
    chip: "«el domingo por la tarde»",
  },
  {
    n: "2",
    title: "Los demás cuelan su carta",
    text: "Eliges de tu mano la foto que más se le parezca y la echas al montón. Nadie sabe cuál es la del narrador.",
    crop: { x: 688, y: 405, w: 195, h: 130, label: "Gato sentado dentro de una ensaladera" },
    tilt: "1.5deg",
    chip: "4 cartas boca arriba en la mesa",
  },
  {
    n: "3",
    title: "Todos votan",
    text: "Si aciertan la tuya, te llevas puntos. Si consigues que piquen con la tuya, te llevas más. Y si no acierta nadie… risas.",
    crop: { x: 1090, y: 545, w: 250, h: 185, label: "Perro escapando con una carta en la boca" },
    tilt: "-1deg",
    chip: "«¡era la del perro!»",
  },
];

function Index() {
  const { user } = useAuth();
  const playTo = user ? "/jugar" : "/auth";

  return (
    <div className="min-h-screen overflow-x-clip">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6">
        <span className="font-display text-2xl font-extrabold tracking-tight">
          Friend<span className="text-gradient-gold">xit</span>
        </span>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <Link to="/como-jugar" className="font-semibold transition hover:text-primary">
            Cómo se juega
          </Link>
          {user && (
            <Link to="/mazos" className="font-semibold transition hover:text-primary">
              Mis mazos
            </Link>
          )}
          <Link
            to={playTo}
            className="rounded-full border-2 border-ink bg-primary px-5 py-2 font-bold text-primary-foreground shadow-ink-sm transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            {user ? "Jugar" : "Entrar"}
          </Link>
        </nav>
      </header>

      <main>
        {/* Portada */}
        <section className="mx-auto max-w-6xl px-5 pt-2 pb-14 md:pt-6">
          <div className="grid items-center gap-10 md:grid-cols-[1.05fr_1fr] md:gap-12">
            <div>
              <span className="inline-block rotate-[-1.5deg] rounded-full border-2 border-ink bg-accent px-4 py-1.5 text-[11px] font-extrabold tracking-[0.18em] text-accent-foreground uppercase">
                Juego de cartas con tus fotos
              </span>
              <h1 className="mt-5 text-4xl leading-[1.03] font-extrabold md:text-6xl">
                Un <span className="text-gradient-gold">Dixit</span> con las fotos de tu galería
              </h1>
              <p className="mt-5 max-w-lg text-lg text-muted-foreground">
                Cada uno sube sus fotos más raras, uno suelta una pista imposible y los demás
                intentan colarle su carta. Se juega en el móvil, en tiempo real, y se ríe bastante.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to={playTo}
                  className="rounded-full border-2 border-ink bg-primary px-8 py-4 text-lg font-extrabold text-primary-foreground shadow-ink transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
                >
                  Montar una partida
                </Link>
                <Link
                  to="/como-jugar"
                  className="rounded-full border-2 border-ink bg-card px-6 py-4 font-bold shadow-ink-sm transition hover:bg-muted active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  Las reglas en 1 minuto
                </Link>
              </div>

              <p className="mt-6 text-sm font-semibold text-muted-foreground">
                Gratis · Sin instalar nada · De 3 a 10 jugadores
              </p>
            </div>

            <div className="relative">
              <span className="tape -top-3 left-8 z-10 rotate-[-6deg]" aria-hidden />
              <span className="tape -top-4 right-10 z-10 rotate-[5deg]" aria-hidden />
              <img
                src={heroLiada}
                alt="Cocina patas arriba: unos amigos juegan con fotos, la abuela hace una foto al techo, un cable lo enreda todo, un gato se ha metido en la ensaladera y un perro escapa con una carta"
                width={1376}
                height={768}
                className="w-full rotate-[-1.2deg] rounded-3xl border-2 border-ink shadow-ink"
              />
            </div>
          </div>
        </section>

        {/* Una ronda en tres pasos */}
        <section className="mx-auto max-w-6xl px-5 pb-16">
          <h2 className="text-3xl font-extrabold md:text-4xl">Una ronda, en corto</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Dura un par de minutos. Se juega por turnos y no hace falta explicar nada raro: si sabes
            jugar al Dixit, sabes jugar aquí.
          </p>

          <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-6">
            {steps.map((s) => (
              <li key={s.n} className="relative">
                <div
                  className="relative mx-auto w-[62%] max-w-[210px] bg-card p-2.5 pb-8 shadow-ink-sm"
                  style={{ rotate: s.tilt, border: "2px solid var(--ink)" }}
                >
                  <Crop
                    x={s.crop.x}
                    y={s.crop.y}
                    w={s.crop.w}
                    h={s.crop.h}
                    label={s.crop.label}
                    className="w-full rounded-sm border border-ink/25 bg-muted"
                  />
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 font-hand text-lg leading-none text-muted-foreground">
                    {s.n === "1" ? "la pista" : s.n === "2" ? "el montón" : "¿quién pica?"}
                  </span>
                </div>
                <span
                  className="absolute -top-4 left-1/2 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border-2 border-ink bg-accent font-display text-lg font-extrabold text-accent-foreground shadow-ink-sm"
                  aria-hidden
                >
                  {s.n}
                </span>
                <h3 className="mt-6 text-center text-xl font-extrabold md:text-left">{s.title}</h3>
                <p className="mt-2 text-center text-sm text-muted-foreground md:text-left">
                  {s.text}
                </p>
                <p className="mt-3 text-center font-hand text-xl text-primary md:text-left">
                  {s.chip}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* De dónde salen las cartas */}
        <section className="mx-auto max-w-6xl px-5 pb-16">
          <div className="surface-panel grid gap-6 p-7 md:grid-cols-[1.4fr_1fr] md:items-center md:p-10">
            <div>
              <h2 className="text-3xl font-extrabold md:text-4xl">¿Y de dónde salen las cartas?</h2>
              <p className="mt-4 text-muted-foreground">
                De tu galería. Esa que no enseñas a nadie. Antes de empezar, cada jugador sube sus
                fotos y se convierten en su mano: el gato, tu abuela, aquella noche, la croqueta
                perfecta… Cuanto más variado sea el mazo, más difícil es acertar.
              </p>
              <p className="mt-4 text-muted-foreground">
                Si el anfitrión prefiere, la sala puede usar un mazo común y jugar todos con las
                fotos de todos.
              </p>
            </div>
            <ul className="grid gap-3 text-sm font-semibold">
              {[
                "6 fotos por jugador",
                "De 3 a 10 en la mesa",
                "El anfitrión abre la sala con un código",
                "El reloj y los puntos van solos",
              ].map((t, i) => (
                <li
                  key={t}
                  className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-card px-4 py-3 shadow-ink-sm"
                  style={{ rotate: i % 2 ? "0.7deg" : "-0.7deg" }}
                >
                  <span className="size-3 shrink-0 rounded-full border-2 border-ink bg-accent" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Llamada final */}
        <section className="mx-auto max-w-4xl px-5 pb-20 text-center">
          <h2 className="text-3xl font-extrabold md:text-5xl">¿Montamos una partida?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Crea la sala, manda el código al grupo y que cada uno traiga sus fotos. En dos minutos
            estáis jugando.
          </p>
          <Link
            to={playTo}
            className="mt-8 inline-block rounded-full border-2 border-ink bg-primary px-9 py-4 text-lg font-extrabold text-primary-foreground shadow-ink transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          >
            Crear una sala
          </Link>
        </section>
      </main>

      <footer className="border-t-2 border-ink/15 py-8 text-center text-sm text-muted-foreground">
        Friendxit — juego inspirado en Dixit, hecho para jugar con amigos.
      </footer>
    </div>
  );
}
