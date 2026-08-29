import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Layers, Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SignedImage } from "@/components/SignedImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mazos")({
  head: () => ({
    meta: [
      { title: "Mis mazos de cartas — Metáfora" },
      {
        name: "description",
        content:
          "Guarda tus mazos de cartas: sube muchas imágenes desde la galería una vez y reutilízalas en cualquier partida.",
      },
      { property: "og:title", content: "Mis mazos de cartas — Metáfora" },
      {
        property: "og:description",
        content: "Sube y guarda tus mazos de cartas para jugar cuando quieras.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Mazos,
});

export type Deck = { id: string; name: string; created_at: string };
export type DeckCard = { id: string; deck_id: string; image_path: string };

function Mazos() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [activeDeck, setActiveDeck] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: deckRows, error } = await supabase
      .from("decks")
      .select("id, name, created_at")
      .order("created_at", { ascending: true });
    if (error) {
      toast.error("No se han podido cargar tus mazos");
      setLoading(false);
      return;
    }
    const list = (deckRows ?? []) as Deck[];
    setDecks(list);
    setActiveDeck((current) => {
      if (current && list.some((d) => d.id === current)) return current;
      return list[0]?.id ?? null;
    });

    const { data: cardRows } = await supabase
      .from("deck_cards")
      .select("id, deck_id, image_path")
      .order("created_at", { ascending: true });
    setCards((cardRows ?? []) as DeckCard[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  async function createDeck() {
    if (!user) return;
    const name = newName.trim() || `Mazo ${decks.length + 1}`;
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("decks")
        .insert({ user_id: user.id, name })
        .select("id")
        .single();
      if (error) throw error;
      setNewName("");
      await load();
      if (data?.id) setActiveDeck(data.id);
      toast.success("Mazo creado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se ha podido crear el mazo");
    } finally {
      setBusy(false);
    }
  }

  async function renameDeck(deck: Deck, name: string) {
    const clean = name.trim();
    if (!clean || clean === deck.name) return;
    await supabase.from("decks").update({ name: clean }).eq("id", deck.id);
    await load();
  }

  async function deleteDeck(deck: Deck) {
    const paths = cards.filter((c) => c.deck_id === deck.id).map((c) => c.image_path);
    setBusy(true);
    try {
      await supabase.from("decks").delete().eq("id", deck.id);
      if (paths.length) await supabase.storage.from("cards").remove(paths);
      await load();
      toast.success("Mazo eliminado");
    } finally {
      setBusy(false);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length || !user || !activeDeck) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/mazos/${activeDeck}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("cards").upload(path, file, {
          contentType: file.type || "image/jpeg",
        });
        if (upErr) throw upErr;
        const { error: insErr } = await supabase
          .from("deck_cards")
          .insert({ deck_id: activeDeck, user_id: user.id, image_path: path });
        if (insErr) throw insErr;
      }
      toast.success("Cartas guardadas en el mazo");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se han podido subir las imágenes");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeCard(card: DeckCard) {
    await supabase.from("deck_cards").delete().eq("id", card.id);
    await supabase.storage.from("cards").remove([card.image_path]);
    await load();
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const deckCards = cards.filter((c) => c.deck_id === activeDeck);
  const current = decks.find((d) => d.id === activeDeck) ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 pb-24">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="flex min-w-0 items-center">
          <Link to="/" className="font-display text-lg font-semibold truncate">
            Met<span className="text-gradient-gold">áfora</span>
          </Link>
        </div>
        <Link
          to="/jugar"
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Jugar
        </Link>
      </header>

      <section className="mt-8">
        <h1 className="text-3xl md:text-4xl">Mis mazos</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Sube todas las imágenes que quieras y guárdalas como un mazo. Después podrás usarlo en
          cualquier partida sin volver a subirlas.
        </p>
      </section>

      <section className="surface-panel mt-6 p-5">
        <div className="grid grid-cols-1 items-end gap-3 sm:flex sm:flex-wrap">
          <div className="min-w-52 flex-1">
            <label htmlFor="deck-name" className="text-sm text-muted-foreground">
              Nombre del nuevo mazo
            </label>
            <Input
              id="deck-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Mazo de viajes"
              className="mt-1"
            />
          </div>
          <Button onClick={createDeck} disabled={busy} className="rounded-full coarse:min-h-11">
            <Plus className="mr-2 h-4 w-4" />
            Crear mazo
          </Button>
        </div>

        {decks.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {decks.map((d) => {
              const count = cards.filter((c) => c.deck_id === d.id).length;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setActiveDeck(d.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition",
                    d.id === activeDeck ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
                  )}
                >
                  <Layers className="h-3.5 w-3.5" />
                  {d.name}
                  <span className="opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {!current ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Todavía no tienes mazos. Crea el primero para empezar a guardar cartas.
        </p>
      ) : (
        <section className="surface-panel mt-6 p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
            <div className="min-w-0">
              <Input
                key={current.id}
                defaultValue={current.name}
                aria-label="Nombre del mazo"
                onBlur={(e) => void renameDeck(current, e.target.value)}
                className="max-w-xs border-transparent bg-transparent px-0 font-display text-xl"
              />
              <p className="text-sm text-muted-foreground">
                {deckCards.length} {deckCards.length === 1 ? "carta guardada" : "cartas guardadas"}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => void handleFiles(e.target.files)}
              />
              <Button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="rounded-full coarse:min-h-11"
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="mr-2 h-4 w-4" />
                )}
                Añadir imágenes
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void deleteDeck(current)}
                className="rounded-full coarse:min-h-11 coarse:min-w-11"
                aria-label="Eliminar mazo"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {deckCards.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Este mazo está vacío. Añade imágenes desde tu galería (puedes seleccionar varias a la
              vez).
            </p>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {deckCards.map((c) => (
                <div key={c.id} className="group relative">
                  <SignedImage
                    path={c.image_path}
                    alt="Carta del mazo"
                    className="aspect-[2/3] w-full rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => void removeCard(c)}
                    className="absolute top-1 right-1 rounded-full bg-background/80 p-2 opacity-0 transition group-hover:opacity-100 coarse:opacity-100"
                    aria-label="Eliminar carta"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
