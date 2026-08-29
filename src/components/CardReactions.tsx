import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Smile } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const REACTION_EMOJIS = ["😂", "🤣", "😭", "❤️", "😮", "🔥", "💀"] as const;

export type Burst = {
  id: string;
  targetId: string;
  emoji: string;
  left: number;
  drift: number;
  duration: number;
  variant: string;
};

const VARIANT_BY_EMOJI: Record<string, string> = {
  "😂": "reaction-wobble",
  "🤣": "reaction-spin",
  "😭": "reaction-drip",
  "❤️": "reaction-beat",
  "😮": "reaction-zoom",
  "🔥": "reaction-flicker",
  "💀": "reaction-shake",
};

/** Reacciones efímeras por broadcast: no tocan la base de datos ni la partida. */
export function useRoomReactions(roomId: string | null | undefined) {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const push = useCallback((b: Burst) => {
    setBursts((prev) => [...prev.slice(-40), b]);
    window.setTimeout(() => {
      setBursts((prev) => prev.filter((x) => x.id !== b.id));
    }, b.duration + 200);
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
        push({
          id: p.id ?? crypto.randomUUID(),
          targetId: p.targetId,
          emoji: p.emoji,
          left: p.left ?? 50,
          drift: p.drift ?? 0,
          duration: p.duration ?? 1800,
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
      const burst: Burst = {
        id: crypto.randomUUID(),
        targetId,
        emoji,
        left: 25 + Math.random() * 50,
        drift: Math.round((Math.random() - 0.5) * 60),
        duration: 1600 + Math.round(Math.random() * 600),
        variant: VARIANT_BY_EMOJI[emoji] ?? "reaction-wobble",
      };
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
          className={cn("reaction-burst", b.variant)}
          style={
            {
              left: `${b.left}%`,
              "--drift": `${b.drift}px`,
              "--dur": `${b.duration}ms`,
            } as React.CSSProperties
          }
        >
          {b.emoji}
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
        aria-label="Reaccionar con emoji"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground shadow-sm backdrop-blur transition hover:text-foreground coarse:h-11 coarse:w-11"
      >
        <Smile className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 z-30 mb-2 flex max-w-[70vw] flex-wrap gap-1 rounded-2xl border border-border bg-popover/95 p-2 shadow-lg backdrop-blur animate-scale-in">
          {REACTION_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              aria-label={`Reaccionar ${e}`}
              onClick={() => onReact(e)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-xl transition hover:scale-125 coarse:h-11 coarse:w-11"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
