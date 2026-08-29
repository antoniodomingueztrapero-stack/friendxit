import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { sala?: string | undefined } => ({
    sala: typeof search["sala"] === "string" ? search["sala"].toUpperCase().slice(0, 12) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar en Metáfora" },
      {
        name: "description",
        content: "Crea tu cuenta o inicia sesión para jugar partidas de Metáfora con tus amigos.",
      },
      { property: "og:title", content: "Entrar en Metáfora" },
      { property: "og:description", content: "Inicia sesión y empieza a jugar con tus amigos." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { sala } = Route.useSearch();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const goNext = useCallback(() => {
    if (sala) navigate({ to: "/sala/$code", params: { code: sala }, replace: true });
    else navigate({ to: "/jugar" });
  }, [sala, navigate]);

  useEffect(() => {
    if (!loading && user) goNext();
  }, [loading, user, goNext]);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: sala
              ? `${window.location.origin}/sala/${sala}`
              : `${window.location.origin}/jugar`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("¡Cuenta creada! Ya puedes jugar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      goNext();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No hemos podido continuar");
    } finally {
      setBusy(false);
    }
  }

  async function handleGuest() {
    setBusy(true);
    try {
      const guestName = name.trim() || `Invitado ${Math.floor(1000 + Math.random() * 9000)}`;
      const { error } = await supabase.auth.signInAnonymously({
        options: { data: { display_name: guestName } },
      });
      if (error) throw error;
      goNext();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se ha podido entrar como invitado");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: sala
        ? `${window.location.origin}/auth?sala=${sala}`
        : window.location.origin,
    });
    if (result.error) {
      toast.error("No se ha podido iniciar sesión con Google");
      return;
    }
    if (result.redirected) return;
    goNext();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="surface-panel w-full max-w-md p-8">
        <Link to="/" className="font-display text-lg font-semibold">
          Met<span className="text-gradient-gold">áfora</span>
        </Link>
        {sala ? (
          <div className="surface-panel mt-6 p-4">
            <p className="text-sm text-muted-foreground">Te invitan a la sala</p>
            <p className="font-display text-2xl tracking-[0.3em] text-primary">{sala}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Escribe tu nombre y entra como invitado: no necesitas cuenta.
            </p>
          </div>
        ) : null}

        <h1 className="mt-6 text-3xl">
          {sala
            ? "Únete a la sala"
            : mode === "login"
              ? "Vuelve a la mesa"
              : "Únete a la partida"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {sala
            ? "Entra como invitado o con tu cuenta para sentarte a la mesa."
            : mode === "login"
              ? "Entra con tu cuenta para crear o unirte a una sala."
              : "Crea una cuenta en segundos y empieza a jugar."}
        </p>

        <div className="mt-6 space-y-2">
          <Label htmlFor="name">Nombre de jugador (opcional)</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Marta"
            autoComplete="nickname"
          />
        </div>

        <Button
          onClick={handleGuest}
          disabled={busy}
          variant={sala ? "default" : "outline"}
          className="mt-4 w-full rounded-full coarse:min-h-11"
        >
          {sala ? `Entrar como invitado en ${sala}` : "Entrar como invitado"}
        </Button>

        <Button
          onClick={handleGoogle}
          variant="secondary"
          className="mt-3 w-full rounded-full coarse:min-h-11"
        >
          Continuar con Google
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Entrar como invitado no requiere registro; usaremos el nombre de arriba en la partida.
        </p>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> o con tu correo{" "}
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full rounded-full">
            {busy ? "Un momento…" : mode === "login" ? "Entrar" : "Crear cuenta"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-6 w-full text-sm text-muted-foreground transition hover:text-foreground"
        >
          {mode === "login" ? "No tengo cuenta — Registrarme" : "Ya tengo cuenta — Entrar"}
        </button>
      </div>
    </div>
  );
}
