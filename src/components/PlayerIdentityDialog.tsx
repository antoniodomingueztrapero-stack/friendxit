import { useEffect, useState } from "react";
import { Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const AVATARS = [
  "🦄",
  "🐙",
  "🦖",
  "🐸",
  "🦩",
  "🐨",
  "🦔",
  "🐷",
  "🦉",
  "🐝",
  "🦥",
  "🐳",
  "👽",
  "🤖",
  "🤡",
  "👻",
  "🧙",
  "🥸",
  "🍕",
  "🥑",
  "🌵",
  "🍄",
  "🚀",
  "🪩",
];

const FUNNY_NAMES = [
  "Patata Cósmica",
  "Pulpo Bailongo",
  "Ninja Dormilón",
  "Croqueta Veloz",
  "Yeti Tímido",
  "Gamba Rebelde",
  "Melón Filósofo",
  "Búho Insomne",
  "Tofu Salvaje",
  "Cactus Rockero",
];

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]!;
}

/** Elige al azar evitando los valores ya usados (y el actual) si quedan libres. */
function pickUnused<T>(list: readonly T[], used: Iterable<T>, current?: T): T {
  const taken = new Set(used);
  if (current !== undefined) taken.add(current);
  const free = list.filter((v) => !taken.has(v));
  if (free.length > 0) return pick(free);
  const notCurrent = list.filter((v) => v !== current);
  return pick(notCurrent.length > 0 ? notCurrent : list);
}

export function randomAvatar(taken: Iterable<string> = [], current?: string) {
  return pickUnused(AVATARS, taken, current);
}

export function randomFunnyName(taken: Iterable<string> = [], current?: string) {
  return pickUnused(FUNNY_NAMES, taken, current);
}

export function PlayerIdentityDialog({
  open,
  initialName,
  initialAvatar,
  takenAvatars = [],
  takenNames = [],
  busy,
  onSave,
}: {
  open: boolean;
  initialName?: string;
  initialAvatar?: string | null;
  takenAvatars?: string[];
  takenNames?: string[];
  busy?: boolean;
  onSave: (name: string, avatar: string) => void;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [avatar, setAvatar] = useState(initialAvatar || randomAvatar(takenAvatars));

  useEffect(() => {
    if (open) {
      setName(initialName ?? "");
      setAvatar(initialAvatar || randomAvatar(takenAvatars));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const clean = name.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/85 p-4 backdrop-blur-sm sm:items-center">
      <div className="surface-panel w-full max-w-md p-6">
        <h2 className="font-display text-2xl">¿Cómo te llamamos?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu nombre y tu avatar aparecerán en la partida para el resto de jugadores.
        </p>

        <div className="mt-5 flex items-end gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-3xl">
            {avatar}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="player-name">Nombre de jugador</Label>
            <Input
              id="player-name"
              value={name}
              maxLength={24}
              autoFocus
              placeholder="Marta"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && clean) onSave(clean, avatar);
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setAvatar(randomAvatar(takenAvatars, avatar));
            if (!clean) setName(randomFunnyName(takenNames));
          }}
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground coarse:min-h-11"
        >
          <Dices className="h-3.5 w-3.5 text-primary" />
          Sorpréndeme (avatar aleatorio)
        </button>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Elige tu avatar</p>
          <div className="mt-2 grid grid-cols-8 gap-1.5">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                title={takenAvatars.includes(a) && a !== avatar ? "Ya lo usa otro jugador" : undefined}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-xl text-xl transition",
                  a === avatar
                    ? "bg-primary/20 ring-2 ring-primary"
                    : takenAvatars.includes(a)
                      ? "bg-secondary/30 opacity-40"
                      : "bg-secondary/60",
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <Button
          className="mt-6 w-full rounded-full coarse:min-h-11"
          disabled={!clean || busy}
          onClick={() => onSave(clean, avatar)}
        >
          {busy ? "Guardando…" : "Entrar en la partida"}
        </Button>
      </div>
    </div>
  );
}
