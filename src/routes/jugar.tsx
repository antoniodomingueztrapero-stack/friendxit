import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { clampPhaseSeconds, DEFAULT_PHASE_SECONDS, generateRoomCode } from "@/lib/game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="mx-auto max-w-3xl px-5 py-10">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center">
          <Link to="/" className="font-display text-lg font-semibold truncate">
            Friend<span className="text-gradient-gold">xit</span>
          </Link>
        </div>
        <nav className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <Link to="/mazos" className="transition hover:text-foreground">
            Mis mazos
          </Link>
          <span className="max-w-[8rem] truncate">{displayName}</span>
          <button onClick={signOut} className="transition hover:text-foreground">
            Salir
          </button>
        </nav>
      </header>

      <h1 className="mt-10 text-4xl">¿Empezamos?</h1>
      <p className="mt-2 text-muted-foreground">
        Crea una sala nueva y comparte el código, o únete a la de tus amigos.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="surface-panel flex flex-col justify-between p-6">
          <div>
            <h2 className="text-xl">Crear sala</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Serás el anfitrión: controlas el inicio de la partida y el paso de las rondas.
            </p>

            <fieldset className="mt-5 space-y-2">
              <legend className="text-sm text-muted-foreground">Modo de juego</legend>
              {(
                [
                  {
                    value: "shared" as const,
                    title: "Mazo común",
                    desc: "Todos aportan fotos a un mazo compartido. Al empezar, cada jugador recibe 6 cartas al azar y tras cada ronda se descarta la jugada y entra otra nueva.",
                  },
                  {
                    value: "personal" as const,
                    title: "Cada uno con sus fotos",
                    desc: "Cada jugador juega únicamente con las imágenes de su galería o de sus mazos guardados.",
                  },
                ]
              ).map((m) => (
                <label
                  key={m.value}
                  className={`flex cursor-pointer gap-3 rounded-2xl border p-3 text-left transition ${
                    mode === m.value ? "border-primary bg-secondary/50" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={m.value}
                    checked={mode === m.value}
                    onChange={() => setMode(m.value)}
                    className="mt-1 accent-[var(--primary)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{m.title}</span>
                    <span className="block text-xs text-muted-foreground">{m.desc}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            <fieldset className="mt-5 space-y-2">
              <legend className="text-sm text-muted-foreground">Ritmo de la partida</legend>
              {(
                [
                  {
                    value: true,
                    title: "Con temporizadores",
                    desc: `Pista ${DEFAULT_PHASE_SECONDS.clue}s, cartas ${DEFAULT_PHASE_SECONDS.submit}s y votos ${DEFAULT_PHASE_SECONDS.vote}s. Si todos terminan antes, se avanza al instante.`,
                  },
                  {
                    value: false,
                    title: "Sin tiempo (manual)",
                    desc: "El anfitrión decide cuándo avanza cada fase, esperando a todos.",
                  },
                ]
              ).map((t) => (
                <label
                  key={String(t.value)}
                  className={`flex cursor-pointer gap-3 rounded-2xl border p-3 text-left transition ${
                    timersEnabled === t.value ? "border-primary bg-secondary/50" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="timers"
                    checked={timersEnabled === t.value}
                    onChange={() => setTimersEnabled(t.value)}
                    className="mt-1 accent-[var(--primary)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{t.title}</span>
                    <span className="block text-xs text-muted-foreground">{t.desc}</span>
                  </span>
                </label>
              ))}

              {timersEnabled && (
                <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border p-3">
                  {(
                    [
                      { key: "clue" as const, label: "Pista (Fase 1)" },
                      { key: "submit" as const, label: "Cartas (Fase 2)" },
                      { key: "vote" as const, label: "Votos (Fase 3)" },
                    ]
                  ).map((f) => (
                    <div key={f.key} className="space-y-1">
                      <Label htmlFor={`t-${f.key}`} className="text-xs text-muted-foreground">
                        {f.label} (s)
                      </Label>
                      <Input
                        id={`t-${f.key}`}
                        type="number"
                        min={f.key === "vote" ? 10 : 15}
                        max={600}
                        value={times[f.key]}
                        onChange={(e) =>
                          setTimes((prev) => ({ ...prev, [f.key]: Number(e.target.value) || 0 }))
                        }
                        className="text-center"
                      />
                    </div>
                  ))}
                </div>
              )}
            </fieldset>
          </div>

          <Button onClick={createRoom} disabled={busy} className="mt-6 w-full rounded-full coarse:min-h-11">
            Crear sala nueva
          </Button>
        </div>

        <form onSubmit={joinRoom} className="surface-panel flex flex-col justify-between p-6">
          <div>
            <h2 className="text-xl">Unirse con código</h2>
            <div className="mt-4 space-y-2">
              <Label htmlFor="code">Código de sala</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ej. K3M7Q"
                maxLength={5}
                className="text-center text-2xl tracking-[0.4em] uppercase"
              />
            </div>
          </div>
          <Button
            type="submit"
            variant="secondary"
            disabled={busy}
            className="mt-6 w-full rounded-full coarse:min-h-11"
          >
            Entrar en la sala
          </Button>
        </form>
      </div>
    </div>
  );
}
