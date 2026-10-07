import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { remainingSeconds } from "@/components/PhaseTimer";

type Props = {
  clue: string;
  storytellerName: string;
  storytellerAvatar?: string | null | undefined;
  /** Momento (ISO) en que se lanzó la pista: si se indica, se muestra la cuenta atrás. */
  startedAt?: string | null | undefined;
  /** Segundos totales de la fase que corre mientras se lee la pista. */
  seconds?: number | null | undefined;
  className?: string | undefined;
};

/**
 * Pista del narrador: compacta y persistente durante la selección y la votación.
 * Si se pasa `startedAt` y `seconds`, incluye la cuenta atrás de la fase.
 */
export function ClueBanner({
  clue,
  storytellerName,
  storytellerAvatar,
  startedAt,
  seconds,
  className,
}: Props) {
  const showTimer = Boolean(startedAt) && typeof seconds === "number" && seconds > 0;
  const [left, setLeft] = useState(() =>
    showTimer ? (remainingSeconds(startedAt, seconds as number) ?? (seconds as number)) : 0,
  );

  useEffect(() => {
    if (!showTimer) return;
    const tick = () =>
      setLeft(remainingSeconds(startedAt, seconds as number) ?? (seconds as number));
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [showTimer, startedAt, seconds]);

  const urgent = showTimer && left <= 10;

  return (
    <div
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border-2 border-ink bg-card px-3 py-2 shadow-ink-sm",
        className,
      )}
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-accent text-lg font-extrabold text-accent-foreground"
      >
        {storytellerAvatar || storytellerName.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
          Pista de {storytellerName}
        </p>
        <p className="font-hand truncate text-xl leading-tight sm:text-2xl">
          <span className="text-gradient-gold">“{clue}”</span>
        </p>
      </div>
      {showTimer && (
        <span
          role="timer"
          aria-live="off"
          className={cn(
            "font-display shrink-0 rounded-full border-2 border-ink px-3 py-1 text-base font-extrabold tabular-nums",
            urgent
              ? "bg-destructive text-destructive-foreground"
              : "bg-accent text-accent-foreground",
          )}
        >
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
        </span>
      )}
    </div>
  );
}
