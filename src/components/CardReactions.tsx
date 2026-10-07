import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Smile } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { sfxReaction, haptic } from "@/lib/fx";

/**
 * Emojis de reacción. Todos dicen algo distinto y cada uno tiene su propio
 * sonido y su propia animación (antes había dos caras de risa casi iguales).
 */
export const REACTION_EMOJIS = ["😂", "😱", "🤯", "🔥", "👀", "🤡", "💩", "🫠"] as const;

export type Burst = {
  id: string;
  targetId: string;
  emoji: string;
  left: number;
  drift: number;
  duration: number;
  variant: string;
  size: number;
  rot: number;
};

const VARIANT_BY_EMOJI: Record<string, string> = {
  "😂": "reaction-wobble",
  "😱": "reaction-shake",
  "🤯": "reaction-zoom",
  "🔥": "reaction-flicker",
  "👀": "reaction-drift",
  "🤡": "reaction-spin",
  "💩": "reaction-drip",
  "🫠": "reaction-melt",
};

/** Cuántas reacciones se ven a la vez sobre la misma carta. */
const MAX_PER_CARD = 6;

function makeBurst(targetId: string, emoji: string): Burst {
  return {
    id: crypto.randomUUID(),
    targetId,
    emoji,
    left: 20 + Math.random() * 60,
    drift: Math.round((Math.random() - 0.5) * 140),
    duration: 1500 + Math.round(Math.random() * 700),
    variant: VARIANT_BY_EMOJI[emoji] ?? "reaction-wobble",
    size: 1.7 + Math.random() * 0.9,
    rot: Math.round((Math.random() - 0.5) * 24),
  };
}

/** Reacciones efímeras por broadcast: no tocan la base de datos ni la partida. */
export function useRoomReactions(roomId: string | null | undefined) {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const push = useCallback((b: Burst) => {
    setBursts((prev) => {
      const sameCard = prev.filter((x) => x.targetId === b.targetId);
      const overflow = sameCard.length - (MAX_PER_CARD - 1);
      const trimmed = overflow > 0 ? prev.filter((x) => x.id !== sameCard[overflow - 1]?.id) : prev;
      return [...trimmed.slice(-60), b];
    });
    window.setTimeout(() => {
      setBursts((prev) => prev.filter((x) => x.id !== b.id));
    }, b.duration + 250);
  }, []);

  useEffect(() => {
    if (!roomId) return;
    const channel = supabase.channel(`reactions-${roomId}`, {
      config: { broadcast: { self: false } },
    });
    channel
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        const p = payload as Partial<Burst>;
        if (!p?.targetId || !p?.emoji) return;
        // A quien la recibe le suena más flojo, pero suena: es parte de la gracia.
        sfxReaction(p.emoji, true);
        push({
          ...makeBurst(p.targetId, p.emoji),
          id: p.id ?? crypto.randomUUID(),
          left: p.left ?? 50,
          drift: p.drift ?? 0,
          duration: p.duration ?? 1900,
          size: p.size ?? 2,
          rot: p.rot ?? 0,
          variant: VARIANT_BY_EMOJI[p.emoji] ?? "reaction-wobble",
        });
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [roomId, push]);

  const react = useCallback(
    (targetId: string, emoji: string) => {
      const burst = makeBurst(targetId, emoji);
      sfxReaction(emoji);
      push(burst);
      void channelRef.current?.send({ type: "broadcast", event: "reaction", payload: burst });
    },
    [push],
  );

  return { bursts, react };
}

export function ReactionOverlay({ bursts }: { bursts: Burst[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {bursts.map((b) => (
        <span
          key={b.id}
          className="reaction-burst"
          style={
            {
              left: `${b.left}%`,
              "--drift": `${b.drift}px`,
              "--dur": `${b.duration}ms`,
              "--size": `${b.size}rem`,
              "--rot": `${b.rot}deg`,
            } as React.CSSProperties
          }
        >
          <span className={cn("reaction-glyph", b.variant)}>{b.emoji}</span>
        </span>
      ))}
    </div>
  );
}

export function ReactionPicker({
  onReact,
  className,
}: {
  onReact: (emoji: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => setOpen(false), 6000);
    return () => window.clearTimeout(t);
  }, [open]);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        aria-label="Reaccionar con un emoji"
        aria-expanded={open}
        onClick={() => {
          haptic(6);
          setOpen((v) => !v);
        }}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-card text-foreground shadow-ink-sm transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none coarse:h-11 coarse:w-11",
          open && "bg-accent",
        )}
      >
        <Smile className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 bottom-full z-30 mb-2 grid w-max grid-cols-4 gap-1 rounded-2xl border-2 border-ink bg-popover p-2 shadow-ink animate-scale-in">
          {REACTION_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              aria-label={`Reaccionar con ${e}`}
              onClick={() => {
                onReact(e);
                setOpen(false);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl transition hover:scale-125 hover:bg-muted active:scale-95 coarse:h-12 coarse:w-12"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
