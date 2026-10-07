import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { sfxTickTock } from "@/lib/fx";

type Props = {
  /** Momento (ISO) en que arrancó la fase: el contador es igual para todos. */
  startedAt: string | null | undefined;
  /** Duración de la fase en segundos. */
  seconds: number;
  label?: string;
  /** Marca cada segundo cuando queda poco tiempo (últimos 10 s). */
  sound?: boolean;
  className?: string;
};

function fmt(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function remainingSeconds(startedAt: string | null | undefined, seconds: number) {
  if (!startedAt) return null;
  const end = new Date(startedAt).getTime() + seconds * 1000;
  return Math.max(0, Math.ceil((end - Date.now()) / 1000));
}

/** Cuenta atrás sincronizada por servidor para la fase actual. */
export function PhaseTimer({ startedAt, seconds, label, sound = false, className }: Props) {
  const [left, setLeft] = useState(() => remainingSeconds(startedAt, seconds) ?? seconds);
  const lastTicked = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const next = remainingSeconds(startedAt, seconds) ?? seconds;
      setLeft(next);
      if (sound && next <= 10 && next > 0 && lastTicked.current !== next) {
        lastTicked.current = next;
        sfxTickTock(next <= 5);
      }
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [startedAt, seconds, sound]);

  const urgent = left <= 10 && left > 0;
  const pct = Math.max(0, Math.min(100, (left / Math.max(seconds, 1)) * 100));

  return (
    <div
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border-2 border-ink bg-card px-3 py-2 shadow-ink-sm",
        className,
      )}
      role="timer"
      aria-live="off"
    >
      <Timer
        className={cn("h-5 w-5 shrink-0 text-primary", urgent && "animate-pulse text-destructive")}
      />
      <div className="min-w-0">
        {label && (
          <p className="truncate text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
        )}
        <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full border-2 border-ink bg-muted">
          <div
            className={cn(
              "h-full rounded-full bg-primary transition-[width] duration-500 ease-linear",
              urgent && "bg-destructive",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span
        className={cn(
          "font-display shrink-0 rounded-full border-2 border-ink px-3 py-0.5 text-lg font-extrabold tabular-nums",
          urgent
            ? "bg-destructive text-destructive-foreground"
            : "bg-accent text-accent-foreground",
        )}
      >
        {fmt(left)}
      </span>
    </div>
  );
}
