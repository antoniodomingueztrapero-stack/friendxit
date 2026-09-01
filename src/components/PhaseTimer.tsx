import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** Momento (ISO) en que arrancó la fase: el contador es igual para todos. */
  startedAt: string | null | undefined;
  /** Duración de la fase en segundos. */
  seconds: number;
  label?: string;
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
export function PhaseTimer({ startedAt, seconds, label, className }: Props) {
  const [left, setLeft] = useState(() => remainingSeconds(startedAt, seconds) ?? seconds);

  useEffect(() => {
    const tick = () => setLeft(remainingSeconds(startedAt, seconds) ?? seconds);
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [startedAt, seconds]);

  const urgent = left <= 10;
  const pct = Math.max(0, Math.min(100, (left / Math.max(seconds, 1)) * 100));

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border bg-card/70 px-3 py-2",
        urgent && "border-destructive/60",
        className,
      )}
      role="timer"
      aria-live="off"
    >
      <Timer className={cn("h-4 w-4 shrink-0 text-primary", urgent && "text-destructive")} />
      <div className="min-w-0 flex-1">
        {label && <p className="truncate text-xs text-muted-foreground">{label}</p>}
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
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
          "shrink-0 font-display text-base tabular-nums",
          urgent ? "text-destructive" : "text-primary",
        )}
      >
        {fmt(left)}
      </span>
    </div>
  );
}
