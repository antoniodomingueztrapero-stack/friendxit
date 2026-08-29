import { useEffect, useMemo, useRef, useState } from "react";
import { Crown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { confettiSubtle, haptic, sfxScoreUp, sfxTick } from "@/lib/fx";


export type ScoreRow = {
  id: string;
  name: string;
  prev: number;
  delta: number;
  isMe?: boolean;
  isStoryteller?: boolean;
};

const ROW_H = 66;

/** Cuenta animada de un número a otro. */
function useCountUp(from: number, to: number, active: boolean, duration = 1100) {
  const [value, setValue] = useState(from);
  useEffect(() => {
    if (!active) {
      setValue(from);
      return;
    }
    if (from === to) {
      setValue(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, active, duration]);
  return value;
}

function Row({
  row,
  rank,
  counting,
  moved,
}: {
  row: ScoreRow;
  rank: number;
  counting: boolean;
  moved: number;
}) {
  const total = row.prev + row.delta;
  const shown = useCountUp(row.prev, total, counting);

  return (
    <div
      className="absolute inset-x-0 transition-[transform,opacity] duration-700 ease-out"
      style={{ transform: `translateY(${rank * ROW_H}px)` }}
    >
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-border bg-card/60 px-3 py-3 sm:px-4",
          row.isMe && "border-primary/60 bg-primary/5",
          counting && row.delta > 0 && "shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]",
        )}
      >
        <span
          className={cn(
            "font-display w-7 shrink-0 text-center text-lg",
            rank === 0 ? "text-primary" : "text-muted-foreground",
          )}
        >
          {rank + 1}
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm sm:text-base">{row.name}</span>
          {row.isStoryteller && <Crown className="h-3.5 w-3.5 shrink-0 text-primary" />}
          {counting && moved > 0 && (
            <span className="flex shrink-0 items-center gap-0.5 text-xs text-primary animate-fade-in">
              <TrendingUp className="h-3 w-3" />
              {moved}
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold transition-opacity duration-500",
              row.delta > 0
                ? "bg-primary/15 text-primary"
                : "bg-secondary text-muted-foreground",
            )}
          >
            {row.delta > 0 ? `+${row.delta}` : "+0"}
          </span>
          <span className="font-display w-10 text-right text-xl text-primary tabular-nums sm:text-2xl">
            {shown}
          </span>
        </span>
      </div>
    </div>
  );
}

export function ScoreBoard({ rows, goal }: { rows: ScoreRow[]; goal?: number }) {
  const [counting, setCounting] = useState(false);
  const startedFor = useRef("");

  const key = useMemo(() => rows.map((r) => `${r.id}:${r.prev}:${r.delta}`).join("|"), [rows]);
  const anyDelta = useMemo(() => rows.some((r) => r.delta > 0), [rows]);

  useEffect(() => {
    if (startedFor.current === key) return;
    startedFor.current = key;
    setCounting(false);
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(
      setTimeout(() => {
        setCounting(true);
        if (!anyDelta) return;
        haptic(8);
        for (let i = 0; i < 6; i++) timers.push(setTimeout(() => sfxTick(i), i * 150));
        timers.push(
          setTimeout(() => {
            sfxScoreUp();
            confettiSubtle({ x: 0.5, y: 0.4 });
          }, 1150),
        );
      }, 900),
    );
    return () => timers.forEach(clearTimeout);
  }, [key, anyDelta]);


  const beforeOrder = useMemo(
    () => [...rows].sort((a, b) => b.prev - a.prev || a.name.localeCompare(b.name)).map((r) => r.id),
    [rows],
  );
  const afterOrder = useMemo(
    () =>
      [...rows]
        .sort((a, b) => b.prev + b.delta - (a.prev + a.delta) || a.name.localeCompare(b.name))
        .map((r) => r.id),
    [rows],
  );

  const order = counting ? afterOrder : beforeOrder;

  return (
    <div>
      <div className="relative" style={{ height: rows.length * ROW_H }}>
        {rows.map((r) => {
          const rank = order.indexOf(r.id);
          const moved = beforeOrder.indexOf(r.id) - afterOrder.indexOf(r.id);
          return <Row key={r.id} row={r} rank={rank} counting={counting} moved={moved} />;
        })}
      </div>
      {goal ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          La partida termina cuando alguien alcanza {goal} puntos.
        </p>
      ) : null}
    </div>
  );
}
