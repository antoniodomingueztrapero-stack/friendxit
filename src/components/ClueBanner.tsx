import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  clue: string;
  storytellerName: string;
  storytellerAvatar?: string | null | undefined;
  /** Momento (ISO) en que se publicó la pista: el temporizador arranca ahí para todos. */
  startedAt?: string | null | undefined;
  className?: string | undefined;
};

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Pista del narrador: compacta y persistente durante toda la fase de selección.
 * Muestra avatar + nombre del narrador y un temporizador sincronizado por servidor.
 */
export function ClueBanner({
  clue,
  storytellerName,
  storytellerAvatar,
  startedAt,
  className,
}: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-primary/30 bg-card/80 px-3 py-2 backdrop-blur-sm",
        className,
      )}
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-lg"
      >
        {storytellerAvatar || storytellerName.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-muted-foreground">{storytellerName}</p>
        <p className="font-display truncate text-base leading-tight sm:text-lg">
          <span className="text-gradient-gold">“{clue}”</span>
        </p>
      </div>
      {startedAt && (
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-border px-2 py-1 font-display text-xs tabular-nums text-muted-foreground">
          <Timer className="h-3.5 w-3.5" />
          {fmt(elapsed)}
        </span>
      )}
    </div>
  );
}
