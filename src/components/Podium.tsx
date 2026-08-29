import { useEffect } from "react";
import { Medal, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { confettiWin, sfxWin } from "@/lib/fx";


export type PodiumPlayer = { id: string; name: string; score: number; isMe?: boolean };

const MEDAL_STYLES = [
  "bg-[#f4c14b]/20 text-[#f4c14b] ring-[#f4c14b]/50",
  "bg-[#c9d1dc]/15 text-[#c9d1dc] ring-[#c9d1dc]/40",
  "bg-[#cd8a4e]/20 text-[#cd8a4e] ring-[#cd8a4e]/40",
];

export function Podium({ players }: { players: PodiumPlayer[] }) {
  const sorted = [...players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const top = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const winner = top[0];

  useEffect(() => {
    const t = setTimeout(() => {
      confettiWin();
      sfxWin();
    }, 400);
    return () => clearTimeout(t);
  }, []);



  // Orden visual del podio: 2º · 1º · 3º
  const layout = [top[1], top[0], top[2]].filter(Boolean) as PodiumPlayer[];
  const heights: Record<string, string> = {};
  top.forEach((p, i) => {
    heights[p.id] = ["h-32 sm:h-40", "h-24 sm:h-28", "h-16 sm:h-20"][i] ?? "h-16";
  });

  return (
    <div>
      <div className="text-center">
        <Trophy className="mx-auto h-10 w-10 text-primary animate-scale-in" />
        <h2 className="font-display mt-3 text-3xl sm:text-4xl">
          Gana <span className="text-gradient-gold">{winner?.name}</span>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          con {winner?.score} puntos · ¡fin de la partida!
        </p>
      </div>

      <div className="mt-8 flex items-end justify-center gap-3 sm:gap-5">
        {layout.map((p) => {
          const rank = top.findIndex((t) => t.id === p.id);
          return (
            <div key={p.id} className="flex w-24 flex-col items-center sm:w-32">
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full ring-2 animate-scale-in",
                  MEDAL_STYLES[rank],
                )}
              >
                <Medal className="h-5 w-5" />
              </span>
              <span
                className={cn(
                  "mt-1 w-full truncate text-center text-sm",
                  p.isMe && "text-primary",
                )}
                title={p.name}
              >
                {p.name}
              </span>
              <span className="font-display text-xl text-primary">{p.score}</span>
              <div
                className={cn(
                  "mt-2 w-full rounded-t-xl border border-b-0 border-border transition-all duration-700",
                  heights[p.id],
                  rank === 0
                    ? "bg-gradient-to-t from-primary/10 to-primary/40"
                    : "bg-gradient-to-t from-secondary/40 to-secondary",
                )}
              />
            </div>
          );
        })}
      </div>

      {rest.length > 0 && (
        <div className="mt-6 space-y-2">
          {rest.map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-border px-4 py-2.5 text-sm",
                p.isMe && "border-primary/60 bg-primary/5",
              )}
            >
              <span className="font-display w-6 text-muted-foreground">{i + 4}</span>
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
              <span className="font-display text-primary">{p.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
