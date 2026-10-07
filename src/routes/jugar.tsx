import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { clampPhaseSeconds, DEFAULT_PHASE_SECONDS, generateRoomCode } from "@/lib/game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/jugar")({
  head: () => ({
    meta: [
      { title: "Crear o unirse a una sala — Friendxit" },
      {
        name: "description",
        content:
          "Crea una sala de Friendxit y comparte el código, o únete a la partida de tus amigos.",
      },
      { property: "og:title", content: "Crear o unirse a una sala — Friendxit" },
      {
        property: "og:description",
        content: "Empieza una partida nueva o entra con el código de tus amigos.",
      },
    ],
  }),
  component: Jugar,
});

const MODES = [
  {
    value: "shared" as const,
    title: "Mazo común",
    desc: "Juntáis las fotos entre todos y se reparten al azar.",
  },
  {
    value: "personal" as const,
    title: "Cada uno con sus fotos",
    desc: "Cada jugador juega con las fotos de su galería.",
  },
];

const PACES = [
  {
    value: true,
    title: "Con cuenta atrás",
    desc: "Cada fase tiene su reloj y avanza sola.",
  },
  {
    value: false,
    title: "Sin reloj",
    desc: "Se pasa de fase cuando todos están listos.",
  },
];

/** Casilla de opción: grande, clara y con borde de tinta cuando está elegida. */
function Choice({
  name,
  checked,
  onSelect,
  title,
  desc,
}: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  title: string;
  desc: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border-2 px-4 py-3 text-left transition",
        checked
          ? "border-ink bg-accent shadow-ink-sm"
          : "border-ink/20 hover:border-ink/45 hover:bg-muted/60",
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="mt-1 size-4 shrink-0 accent-[var(--primary)]"
      />
      <span className="min-w-0">
        <span className="block font-bold">{title}</span>
        <span
          className={cn(
            "block text-xs",
            checked ? "text-accent-foreground/80" : "text-muted-foreground",
          )}
        >
          {desc}
        </span>
      </span>
    </label>
  );
}

function Jugar() {
  const navigate = useNavigate();
  const { user, loading, displayName, signOut } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"shared" | "personal">("shared");
  const [timersEnabled, setTimersEnabled] = useState(true);
  const [times, setTimes] = useState({ ...DEFAULT_PHASE_SECONDS });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  async function createRoom() {
    if (!user) return;
    setBusy(true);
    try {
      const newCode = generateRoomCode();
      const { data, error } = await supabase
        .from("rooms")
        .insert({
          code: newCode,
          host_id: user.id,
          mode,
          timers_enabled: timersEnabled,
          clue_seconds: clampPhaseSeconds("clue", times.clue),
          submit_seconds: clampPhaseSeconds("submit", times.submit),
          vote_seconds: clampPhaseSeconds("vote", times.vote),
        })
        .select("id, code")
        .single();
      if (error) throw error;
      await supabase.from("room_players").insert({ room_id: data.id, user_id: user.id });
      navigate({ to: "/sala/$code", params: { code: data.code } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se ha podido crear la sala");
    } finally {
      setBusy(false);
    }
  }

  async function joinRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, code")
        .eq("code", clean)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        toast.error("No existe ninguna sala con ese código");
        return;
      }
      await supabase
        .from("room_players")
        .upsert({ room_id: data.id, user_id: user.id }, { onConflict: "room_id,user_id" });
      navigate({ to: "/sala/$code", params: { code: data.code } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se ha podido entrar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="font-display text-xl font-extrabold tracking-tight">
          Friend<span className="text-gradient-gold">xit</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold">
          <Link to="/mazos" className="transition hover:text-primary">
            Mis mazos
          </Link>
          <span className="max-w-[8rem] truncate text-muted-foreground">{displayName}</span>
          <button onClick={signOut} className="transition hover:text-primary">
            Salir
          </button>
        </nav>
      </header>

      <h1 className="mt-9 text-4xl font-extrabold md:text-5xl">¿Empezamos?</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Monta una sala y pasa el código, o entra con el que te hayan dado.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-[1.1fr_1fr]">
        {/* Crear */}
        <section className="surface-panel p-5 sm:p-6" style={{ rotate: "-0.4deg" }}>
          <h2 className="text-2xl font-extrabold">Montar una sala</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tú mandas: cuándo empieza y cuándo se pasa de ronda.
          </p>

          <fieldset className="mt-5">
            <legend className="text-sm font-bold">¿Cómo repartimos las fotos?</legend>
            <div className="mt-2 space-y-2">
              {MODES.map((m) => (
                <Choice
                  key={m.value}
                  name="mode"
                  checked={mode === m.value}
                  onSelect={() => setMode(m.value)}
                  title={m.title}
                  desc={m.desc}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="text-sm font-bold">¿Con reloj?</legend>
            <div className="mt-2 space-y-2">
              {PACES.map((p) => (
                <Choice
                  key={String(p.value)}
                  name="pace"
                  checked={timersEnabled === p.value}
                  onSelect={() => setTimersEnabled(p.value)}
                  title={p.title}
                  desc={p.desc}
                />
              ))}
            </div>
          </fieldset>

          {timersEnabled && (
            <div className="mt-3 grid grid-cols-3 gap-3 rounded-2xl border-2 border-dashed border-ink/25 p-3">
              {[
                { key: "clue" as const, label: "Pista" },
                { key: "submit" as const, label: "Cartas" },
                { key: "vote" as const, label: "Votos" },
              ].map((f) => (
                <label key={f.key} className="block text-center">
                  <span className="block text-xs font-bold text-muted-foreground">{f.label}</span>
                  <Input
                    type="number"
                    min={f.key === "vote" ? 10 : 15}
                    max={600}
                    value={times[f.key]}
                    onChange={(e) =>
                      setTimes((prev) => ({ ...prev, [f.key]: Number(e.target.value) || 0 }))
                    }
                    className="mt-1 text-center text-lg font-bold tabular-nums"
                  />
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">segundos</span>
                </label>
              ))}
            </div>
          )}

          <button
            onClick={createRoom}
            disabled={busy}
            className="font-display mt-6 w-full rounded-full border-2 border-ink bg-primary px-8 py-4 text-lg font-extrabold text-primary-foreground shadow-ink transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-50 coarse:min-h-14"
          >
            Crear la sala
          </button>
        </section>

        {/* Entrar */}
        <section className="surface-panel flex flex-col p-5 sm:p-6" style={{ rotate: "0.5deg" }}>
          <h2 className="text-2xl font-extrabold">Tengo un código</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Te lo habrá pasado quien monta la partida. Son 5 caracteres.
          </p>
          <form onSubmit={joinRoom} className="mt-5 flex flex-1 flex-col justify-between">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="K3M7Q"
              maxLength={5}
              autoComplete="off"
              aria-label="Código de la sala"
              className="font-display w-full rounded-2xl border-2 border-ink bg-card px-4 py-5 text-center text-4xl font-extrabold tracking-[0.3em] uppercase shadow-ink-sm placeholder:text-muted-foreground/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent sm:text-5xl"
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={busy || code.trim().length < 4}
              className="mt-5 w-full rounded-full border-2 border-ink py-4 text-lg font-extrabold shadow-ink-sm coarse:min-h-13"
            >
              Entrar en la sala
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
