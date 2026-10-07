import { useEffect, useState } from "react";
import { Pencil, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { remainingSeconds } from "@/components/PhaseTimer";
import { sfxClue } from "@/lib/fx";

type TimerProps = {
  startedAt?: string | null | undefined;
  seconds?: number | null | undefined;
};

function useCountdown({ startedAt, seconds }: TimerProps) {
  const active = Boolean(startedAt) && typeof seconds === "number" && seconds > 0;
  const [left, setLeft] = useState(() =>
    active ? (remainingSeconds(startedAt, seconds as number) ?? (seconds as number)) : 0,
  );

  useEffect(() => {
    if (!active) return;
    const tick = () =>
      setLeft(remainingSeconds(startedAt, seconds as number) ?? (seconds as number));
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [active, startedAt, seconds]);

  return { active, left };
}

function fmt(total: number) {
  const m = Math.floor(total / 60);
  return `${m}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * "¡Te toca!": cuando el jugador es narrador, se le come la pantalla entera.
 * Antes esto era una línea de texto gris.
 */
export function StorytellerMoment({
  name,
  avatar,
  startedAt,
  seconds,
  onPick,
}: TimerProps & { name: string; avatar?: string | null | undefined; onPick: () => void }) {
  const { active, left } = useCountdown({ startedAt, seconds });
  const urgent = active && left <= 10;

  useEffect(() => {
    sfxClue();
  }, []);

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "var(--paper-grain), var(--gradient-paper)" }}
      />
      <div className="relative mx-auto flex min-h-full max-w-xl flex-col items-center justify-center px-5 py-10 text-center">
        <span className="relative inline-block rotate-[-2deg]">
          <span className="font-hand text-4xl text-primary sm:text-5xl">¡Te toca!</span>
        </span>

        <h1 className="font-display mt-2 text-4xl leading-[0.95] font-extrabold sm:text-6xl">
          ERES EL
          <br />
          NARRADOR
        </h1>

        <span
          aria-hidden
          className="mt-6 flex size-20 items-center justify-center rounded-full border-2 border-ink bg-card text-4xl shadow-ink"
        >
          {avatar || "🎩"}
        </span>
        <p className="mt-2 font-bold text-muted-foreground">{name}</p>

        <p className="mt-6 max-w-sm text-base text-muted-foreground">
          Elige una foto y escribe una pista: una palabra, una frase, una canción… Que no sea ni
          obvia ni imposible: tú decides a quién quieres pillar.
        </p>

        {active && (
          <div
            role="timer"
            aria-live="off"
            className={cn(
              "font-display mt-6 rounded-full border-2 border-ink px-6 py-2 text-3xl font-extrabold tabular-nums shadow-ink-sm",
              urgent
                ? "bg-destructive text-destructive-foreground"
                : "bg-accent text-accent-foreground",
            )}
          >
            {fmt(left)}
          </div>
        )}

        <button
          onClick={onPick}
          className="font-display mt-7 flex items-center gap-3 rounded-full border-2 border-ink bg-primary px-8 py-5 text-lg font-extrabold text-primary-foreground shadow-ink transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none coarse:min-h-14"
        >
          <Pencil className="h-5 w-5" />
          Elegir carta y escribir la pista
        </button>

        <p className="mt-5 flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          Los demás están esperando tu pista
        </p>
      </div>
    </div>
  );
}

/** Lo que ven los demás mientras el narrador piensa: sin prisas, pero con gracia. */
export function WaitingForClue({
  name,
  avatar,
  startedAt,
  seconds,
}: TimerProps & { name: string; avatar?: string | null | undefined }) {
  const { active, left } = useCountdown({ startedAt, seconds });
  const urgent = active && left <= 10;

  return (
    <div className="mt-6 flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-ink/30 bg-card/60 px-5 py-8 text-center">
      <span
        aria-hidden
        className="flex size-16 animate-bounce items-center justify-center rounded-full border-2 border-ink bg-card text-3xl shadow-ink-sm"
      >
        {avatar || "🎩"}
      </span>
      <p className="font-hand text-2xl leading-tight sm:text-3xl">
        {name} está pensando una pista
        <span className="inline-flex w-8 justify-start">
          <span className="animate-pulse">…</span>
        </span>
      </p>
      {active ? (
        <span
          role="timer"
          aria-live="off"
          className={cn(
            "font-display rounded-full border-2 border-ink px-4 py-1 text-xl font-extrabold tabular-nums",
            urgent
              ? "bg-destructive text-destructive-foreground"
              : "bg-accent text-accent-foreground",
          )}
        >
          {fmt(left)}
        </span>
      ) : (
        <p className="text-sm font-bold text-muted-foreground">
          Aquí nadie tiene prisa: la ronda avanza cuando estés listo
        </p>
      )}
    </div>
  );
}
