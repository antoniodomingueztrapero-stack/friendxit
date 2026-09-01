import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, ImagePlus, Layers, Loader2, Crown, Share2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { computeScores, phaseLabel } from "@/lib/game";
import { SignedImage } from "@/components/SignedImage";
import { ScoreBoard, type ScoreRow } from "@/components/ScoreBoard";
import { Podium } from "@/components/Podium";
import { HandCarousel } from "@/components/HandCarousel";
import { ClueBanner } from "@/components/ClueBanner";
import {
  ReactionOverlay,
  ReactionPicker,
  useRoomReactions,
} from "@/components/CardReactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { confettiSubtle, sfxReveal } from "@/lib/fx";
import { PlayerIdentityDialog } from "@/components/PlayerIdentityDialog";
import { roomInviteUrl } from "@/lib/site";



export const Route = createFileRoute("/sala/$code")({
  head: () => ({
    meta: [
      { title: "Sala de juego — Friendxit" },
      {
        name: "description",
        content: "Sube tus cartas desde la galería y juega la partida con tu grupo en tiempo real.",
      },
      { property: "og:title", content: "Sala de juego — Friendxit" },
      { property: "og:description", content: "Partida de Friendxit en curso." },
    ],
  }),
  component: Sala,
});

type Room = { id: string; code: string; host_id: string; status: string; mode: string };
type Player = {
  user_id: string;
  score: number;
  name: string;
  avatar: string | null;
  is_ready: boolean;
  discards_used: number;
};
type Round = {
  id: string;
  number: number;
  storyteller_id: string;
  clue: string | null;
  clue_at: string | null;
  phase: string;
};
type Card = { id: string; image_path: string; cardId?: string | null };
type Submission = {
  id: string;
  player_id: string;
  card_id: string | null;
  image_path: string;
  is_storyteller: boolean;
};
type Vote = { voter_id: string; submission_id: string };
type RoundScore = { player_id: string; points: number; total_after: number };

const WIN_SCORE = 30;

function Sala() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [round, setRound] = useState<Round | null>(null);
  const [hand, setHand] = useState<Card[]>([]);
  const [pool, setPool] = useState<Card[]>([]);
  const [poolTotal, setPoolTotal] = useState(0);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [roundScores, setRoundScores] = useState<RoundScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [clue, setClue] = useState("");
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [decks, setDecks] = useState<{ id: string; name: string; count: number }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [identityDone, setIdentityDone] = useState(false);
  const [pendingVote, setPendingVote] = useState<string | null>(null);
  const { bursts, react } = useRoomReactions(room?.id);

  const prevStatus = useRef<string | null>(null);
  const isHost = !!room && !!user && room.host_id === user.id;
  const meReady = !!players.find((p) => p.user_id === user?.id)?.is_ready;
  const readyCount = players.filter((p) => p.is_ready).length;
  const allReady = players.length >= 3 && readyCount === players.length;
  const isShared = room?.mode === "shared";
  const isStoryteller = !!round && !!user && round.storyteller_id === user.id;
  const mySubmission = submissions.find((s) => s.player_id === user?.id) ?? null;
  const myVote = votes.find((v) => v.voter_id === user?.id) ?? null;
  const canPickCard =
    room?.status === "playing" &&
    !!round &&
    ((round.phase === "clue" && isStoryteller) ||
      (round.phase === "submit" && !isStoryteller && !mySubmission));

  // Descartes: 3 por partida, solo en modo mazo común.
  const MAX_DISCARDS = 3;
  const discardsUsed = players.find((p) => p.user_id === user?.id)?.discards_used ?? 0;
  const discardsLeft = Math.max(MAX_DISCARDS - discardsUsed, 0);
  const canDiscard = !!isShared && room?.status === "playing" && discardsLeft > 0;


  const nameOf = useCallback(
    (id: string) => players.find((p) => p.user_id === id)?.name ?? "Jugador",
    [players],
  );

  const load = useCallback(async () => {
    if (!user) return;
    const { data: roomRow } = await supabase
      .from("rooms")
      .select("id, code, host_id, status, mode")
      .eq("code", code.toUpperCase())
      .maybeSingle();

    if (!roomRow) {
      setRoom(null);
      setLoading(false);
      return;
    }
    setRoom(roomRow as Room);
    const shared = roomRow.mode === "shared";

    const { data: memberRows } = await supabase
      .from("room_players")
      .select("user_id, score, joined_at, is_ready, discards_used")
      .eq("room_id", roomRow.id)
      .order("joined_at", { ascending: true });

    let members = memberRows ?? [];
    if (!members.some((m) => m.user_id === user.id)) {
      // La sala queda cerrada a nuevos jugadores una vez iniciada la partida.
      if (roomRow.status !== "lobby") {
        setBlocked(true);
        setLoading(false);
        return;
      }
      await supabase
        .from("room_players")
        .upsert({ room_id: roomRow.id, user_id: user.id }, { onConflict: "room_id,user_id" });
      const { data: refreshed } = await supabase
        .from("room_players")
        .select("user_id, score, joined_at, is_ready, discards_used")
        .eq("room_id", roomRow.id)
        .order("joined_at", { ascending: true });
      members = refreshed ?? members;
    }
    setBlocked(false);

    const ids = members.map((m) => m.user_id);
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("id, display_name, avatar")
      .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

    setPlayers(
      members.map((m) => ({
        user_id: m.user_id,
        score: m.score,
        is_ready: !!m.is_ready,
        discards_used: m.discards_used ?? 0,
        name: profileRows?.find((p) => p.id === m.user_id)?.display_name ?? "Jugador",
        avatar: profileRows?.find((p) => p.id === m.user_id)?.avatar ?? null,
      })),
    );

    if (shared) {
      const { data: handRows } = await supabase
        .from("cards")
        .select("id, image_path")
        .eq("room_id", roomRow.id)
        .eq("holder_id", user.id)
        .eq("played", false)
        .order("created_at", { ascending: true });
      setHand((handRows ?? []).map((c) => ({ ...c, cardId: c.id })));

      const { data: poolRows } = await supabase
        .from("cards")
        .select("id, image_path")
        .eq("room_id", roomRow.id)
        .eq("owner_id", user.id)
        .is("holder_id", null)
        .eq("played", false)
        .order("created_at", { ascending: true });
      setPool(poolRows ?? []);

      const { data: count } = await supabase.rpc("shared_pool_count", { _room_id: roomRow.id });
      setPoolTotal(typeof count === "number" ? count : 0);
    } else {
      // Modo personal: no hay mazo previo. La "mano" es toda la galería personal
      // del jugador (sus mazos guardados + las fotos que suba durante la partida).
      const [{ data: cardRows }, { data: deckCardRows }] = await Promise.all([
        supabase
          .from("cards")
          .select("id, image_path")
          .eq("room_id", roomRow.id)
          .eq("owner_id", user.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("deck_cards")
          .select("id, image_path")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
      ]);
      const gallery: Card[] = [];
      const seen = new Set<string>();
      for (const c of cardRows ?? []) {
        if (seen.has(c.image_path)) continue;
        seen.add(c.image_path);
        gallery.push({ id: c.id, image_path: c.image_path, cardId: c.id });
      }
      for (const c of deckCardRows ?? []) {
        if (seen.has(c.image_path)) continue;
        seen.add(c.image_path);
        gallery.push({ id: c.id, image_path: c.image_path, cardId: null });
      }
      setHand(gallery);
      setPool([]);
      setPoolTotal(0);
    }


    const { data: roundRow } = await supabase
      .from("rounds")
      .select("id, number, storyteller_id, clue, clue_at, phase")
      .eq("room_id", roomRow.id)
      .order("number", { ascending: false })
      .limit(1)
      .maybeSingle();
    setRound((roundRow as Round) ?? null);

    if (roundRow) {
      const { data: subRows } = await supabase
        .from("submissions")
        .select("id, player_id, card_id, image_path, is_storyteller")
        .eq("round_id", roundRow.id)
        .order("created_at", { ascending: true });
      setSubmissions((subRows as Submission[]) ?? []);
      const { data: voteRows } = await supabase
        .from("votes")
        .select("voter_id, submission_id")
        .eq("round_id", roundRow.id);
      setVotes((voteRows as Vote[]) ?? []);
      const { data: scoreRows } = await supabase
        .from("round_scores")
        .select("player_id, points, total_after")
        .eq("round_id", roundRow.id);
      setRoundScores((scoreRows as RoundScore[]) ?? []);
    } else {
      setSubmissions([]);
      setVotes([]);
      setRoundScores([]);
    }

    setLoading(false);
  }, [code, user]);

  useEffect(() => {
    if (!authLoading && !user)
      navigate({ to: "/auth", search: { sala: code.toUpperCase() }, replace: true });
  }, [authLoading, user, navigate, code]);


  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  // Notificación automática cuando el anfitrión empieza la partida
  useEffect(() => {
    if (!room) return;
    const prev = prevStatus.current;
    prevStatus.current = room.status;
    if (prev === "lobby" && room.status === "playing") {
      toast.success("¡La partida ha empezado!", {
        description: "Entra al juego: el narrador ya está eligiendo su carta.",
      });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(200);
    }
  }, [room]);

  async function toggleReady() {
    if (!room) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc("set_player_ready", {
        _room_id: room.id,
        _ready: !meReady,
      });
      if (error) throw error;
      toast.success(!meReady ? "Estás listo" : "Ya no estás listo");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se ha podido actualizar tu estado");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const { data: deckRows } = await supabase.from("decks").select("id, name").order("created_at");
      const { data: deckCardRows } = await supabase.from("deck_cards").select("deck_id");
      if (cancelled) return;
      setDecks(
        (deckRows ?? []).map((d) => ({
          id: d.id,
          name: d.name,
          count: (deckCardRows ?? []).filter((c) => c.deck_id === d.id).length,
        })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [user, hand.length]);

  // Confeti + sonido sutil al entrar en la fase de resultados.
  const revealFxFor = useRef("");
  useEffect(() => {
    if (!round || round.phase !== "reveal") return;
    if (revealFxFor.current === round.id) return;
    revealFxFor.current = round.id;
    sfxReveal();
    confettiSubtle({ x: 0.5, y: 0.3 });
  }, [round]);

  useEffect(() => {
    if (!room) return;
    // Agrupa ráfagas de cambios realtime en una sola recarga: evita una
    // avalancha de consultas cuando varios jugadores actúan a la vez.
    let timer: ReturnType<typeof setTimeout> | null = null;
    const reload = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void load(), 250);
    };
    const channel = supabase
      .channel(`room-${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, reload)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${room.id}` },
        reload,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rounds", filter: `room_id=eq.${room.id}` },
        reload,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submissions", filter: `room_id=eq.${room.id}` },
        reload,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes", filter: `room_id=eq.${room.id}` },
        reload,
      )
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [room, load]);

  const shuffled = useMemo(() => {
    return [...submissions].sort((a, b) => a.id.localeCompare(b.id));
  }, [submissions]);

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length || !room || !user) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/${room.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("cards").upload(path, file, {
          contentType: file.type || "image/jpeg",
        });
        if (upErr) throw upErr;
        const { error: insErr } = await supabase
          .from("cards")
          .insert({ room_id: room.id, owner_id: user.id, image_path: path });
        if (insErr) throw insErr;
      }
      toast.success(isShared ? "Fotos añadidas al mazo común" : "Fotos añadidas a tu galería");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se han podido subir las imágenes");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeCard(card: Card) {
    await supabase.from("cards").delete().eq("id", card.cardId ?? card.id);
    // Las cartas que vienen de un mazo guardado no se borran del almacenamiento:
    // siguen perteneciendo al mazo del jugador.
    if (!card.image_path.includes("/mazos/")) {
      await supabase.storage.from("cards").remove([card.image_path]);
    }
    await load();
  }


  async function discardCard(card: Card) {
    if (!room || !user || !card.cardId) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("discard_card", {
        _room_id: room.id,
        _card_id: card.cardId,
      });
      if (error) throw error;
      await load();
      toast.success(
        data
          ? `Carta descartada. Te quedan ${Math.max(discardsLeft - 1, 0)} descartes.`
          : "Carta descartada, pero no quedan cartas en el mazo común.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se ha podido descartar");
    } finally {
      setBusy(false);
    }
  }

  async function importDeck(deckId: string) {
    if (!room || !user) return;
    setUploading(true);
    try {
      const { data: deckCards, error } = await supabase
        .from("deck_cards")
        .select("image_path")
        .eq("deck_id", deckId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const existing = new Set([...hand, ...pool].map((c) => c.image_path));
      const rows = (deckCards ?? [])
        .filter((c) => !existing.has(c.image_path))
        .map((c) => ({ room_id: room.id, owner_id: user.id, image_path: c.image_path }));
      if (!rows.length) {
        toast.info(isShared ? "Ese mazo ya está en el mazo común" : "Ese mazo ya está en tu mano");
        return;
      }
      const { error: insErr } = await supabase.from("cards").insert(rows);
      if (insErr) throw insErr;
      toast.success(
        isShared
          ? `${rows.length} fotos aportadas al mazo común`
          : `${rows.length} cartas añadidas desde tu mazo`,
      );
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se ha podido cargar el mazo");
    } finally {
      setUploading(false);
    }
  }

  async function startGame() {
    if (!room) return;
    if (players.length < 3) {
      toast.error("Hacen falta al menos 3 jugadores");
      return;
    }
    const first = players[0];
    if (!first) {
      toast.error("No se ha podido elegir narrador");
      return;
    }
    if (isShared && poolTotal < players.length * 6) {
      toast.error(
        `El mazo común necesita ${players.length * 6} fotos y tiene ${poolTotal}. Que aporten más.`,
      );
      return;
    }
    setBusy(true);
    try {
      if (isShared) {
        const { error } = await supabase.rpc("deal_shared_hands", {
          _room_id: room.id,
          _hand_size: 6,
        });
        if (error) throw error;
      }
      await supabase.from("rooms").update({ status: "playing" }).eq("id", room.id);
      await supabase.from("rounds").insert({
        room_id: room.id,
        number: 1,
        storyteller_id: first.user_id,
        phase: "clue",
      });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se ha podido empezar la partida");
    } finally {
      setBusy(false);
    }
  }

  async function submitClue(card: Card) {
    if (!room || !round || !user) return;
    if (!clue.trim()) {
      toast.error("Escribe una pista");
      return;
    }
    setBusy(true);
    try {
      await supabase.from("submissions").insert({
        round_id: round.id,
        room_id: room.id,
        player_id: user.id,
        card_id: card.cardId ?? null,
        image_path: card.image_path,
        is_storyteller: true,
      });
      // Solo en modo mazo común se consume la carta; en modo personal la galería
      // sigue disponible entera en las siguientes rondas.
      if (isShared && card.cardId) {
        await supabase.from("cards").update({ played: true }).eq("id", card.cardId);
      }
      await supabase
        .from("rounds")
        .update({ clue: clue.trim(), clue_at: new Date().toISOString(), phase: "submit" })
        .eq("id", round.id);
      setClue("");
      setCarouselOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se ha podido enviar");
    } finally {
      setBusy(false);
    }
  }

  async function submitCard(card: Card) {
    if (!room || !round || !user) return;
    setBusy(true);
    try {
      await supabase.from("submissions").insert({
        round_id: round.id,
        room_id: room.id,
        player_id: user.id,
        card_id: card.cardId ?? null,
        image_path: card.image_path,
        is_storyteller: false,
      });
      if (isShared && card.cardId) {
        await supabase.from("cards").update({ played: true }).eq("id", card.cardId);
      }
      setCarouselOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se ha podido enviar");
    } finally {
      setBusy(false);
    }
  }

  // Al cambiar de ronda o de fase se descarta cualquier selección de voto pendiente.
  const roundId = round?.id ?? null;
  const roundPhase = round?.phase ?? null;
  useEffect(() => {
    setPendingVote(null);
  }, [roundId, roundPhase]);

  async function vote(submissionId: string) {
    if (!room || !round || !user) return;
    setBusy(true);
    try {
      await supabase.from("votes").insert({
        round_id: round.id,
        room_id: room.id,
        voter_id: user.id,
        submission_id: submissionId,
      });
      setPendingVote(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se ha podido votar");
    } finally {
      setBusy(false);
    }
  }

  async function goToVoting() {
    if (!round) return;
    setBusy(true);
    try {
      await supabase.from("rounds").update({ phase: "vote" }).eq("id", round.id);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function reveal() {
    if (!round || !room || round.phase !== "vote") return;
    setBusy(true);
    try {
      const deltas = computeScores(
        submissions,
        votes,
        round.storyteller_id,
        players.map((p) => p.user_id),
      );
      const rows = players.map((p) => ({
        round_id: round.id,
        room_id: room.id,
        player_id: p.user_id,
        points: deltas[p.user_id] ?? 0,
        total_after: p.score + (deltas[p.user_id] ?? 0),
      }));
      await supabase.from("round_scores").upsert(rows, { onConflict: "round_id,player_id" });
      for (const p of players) {
        const delta = deltas[p.user_id] ?? 0;
        if (delta !== 0) {
          await supabase
            .from("room_players")
            .update({ score: p.score + delta })
            .eq("room_id", room.id)
            .eq("user_id", p.user_id);
        }
      }
      await supabase.from("rounds").update({ phase: "reveal" }).eq("id", round.id);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function nextRound() {
    if (!round || !room) return;
    // La ronda ya ha terminado y los puntos están sumados: ahora se comprueba el final.
    if (players.some((p) => p.score >= WIN_SCORE)) {
      setBusy(true);
      try {
        await supabase.from("rooms").update({ status: "finished" }).eq("id", room.id);
        await load();
      } finally {
        setBusy(false);
      }
      return;
    }
    const idx = players.findIndex((p) => p.user_id === round.storyteller_id);
    const next = players[(idx + 1) % players.length];
    if (!next) {
      toast.error("No se ha podido elegir el siguiente narrador");
      return;
    }
    setBusy(true);
    try {
      if (isShared) {
        // Se descartan las cartas jugadas y se reparte una nueva al azar a cada jugador.
        const { error } = await supabase.rpc("deal_shared_hands", {
          _room_id: room.id,
          _hand_size: 6,
        });
        if (error) throw error;
      }
      await supabase.from("rounds").insert({
        room_id: room.id,
        number: round.number + 1,
        storyteller_id: next.user_id,
        phase: "clue",
      });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se ha podido pasar de ronda");
    } finally {
      setBusy(false);
    }
  }

  function copyCode() {
    if (!room) return;
    void navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function shareInvite() {
    if (!room) return;
    const url = roomInviteUrl(room.code);
    const text = `Únete a mi partida de Friendxit (código ${room.code}): ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Friendxit", text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Enlace de invitación copiado", { description: url });
    } catch {
      /* el usuario ha cancelado */
    }
  }



  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="surface-panel max-w-md p-8 text-center">
          <h1 className="text-2xl">Sala no encontrada</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Revisa el código con tus amigos e inténtalo otra vez.
          </p>
          <Link
            to="/jugar"
            className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Volver
          </Link>
        </div>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="surface-panel max-w-md p-8 text-center">
          <h1 className="text-2xl">La partida ya ha comenzado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta sala está cerrada: solo pueden participar los jugadores que entraron antes de
            que el anfitrión iniciara la partida.
          </p>
          <Link
            to="/jugar"
            className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Volver
          </Link>
        </div>
      </div>
    );
  }

  const me = players.find((p) => p.user_id === user?.id) ?? null;
  const genericName =
    !me?.name || me.name === "Jugador" || /^invitado/i.test(me.name) || /^user/i.test(me.name);
  const needsIdentity = !!me && !identityDone && (genericName || !me.avatar);
  const labelOf = (p: Player) =>
    `${p.avatar ? `${p.avatar} ` : ""}${p.name}${p.user_id === user?.id ? " (tú)" : ""}`;

  async function saveIdentity(name: string, avatar: string) {
    if (!user) return;
    setSavingIdentity(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, display_name: name, avatar }, { onConflict: "id" });
      if (error) throw error;
      setIdentityDone(true);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se ha podido guardar tu nombre");
    } finally {
      setSavingIdentity(false);
    }
  }

  const votersNeeded = players.length - 1;
  const allSubmitted = submissions.length === players.length;
  const allVoted = votes.length >= votersNeeded;
  const storySub = submissions.find((s) => s.is_storyteller);
  const scoreRows: ScoreRow[] = players.map((p) => {
    const rs = roundScores.find((r) => r.player_id === p.user_id);
    const points = rs?.points ?? 0;
    const totalAfter = rs?.total_after ?? p.score;
    return {
      id: p.user_id,
      name: labelOf(p),
      prev: totalAfter - points,
      delta: points,
      isMe: p.user_id === user?.id,
      isStoryteller: round?.storyteller_id === p.user_id,
    };
  });
  const gameOver = players.some((p) => p.score >= WIN_SCORE);


  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 pb-24">
      <PlayerIdentityDialog
        open={needsIdentity}
        initialName={genericName ? "" : (me?.name ?? "")}
        initialAvatar={me?.avatar ?? null}
        takenAvatars={players
          .filter((p) => p.user_id !== user?.id && p.avatar)
          .map((p) => p.avatar as string)}
        takenNames={players.filter((p) => p.user_id !== user?.id).map((p) => p.name)}
        busy={savingIdentity}
        onSave={saveIdentity}
      />
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="flex min-w-0 items-center">
          <Link to="/" className="font-display text-lg font-semibold truncate">
            Friend<span className="text-gradient-gold">xit</span>
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={copyCode}
            className="surface-panel flex shrink-0 items-center gap-2 px-3 py-2 text-sm sm:px-4"
            title="Copiar código"
          >
            <span className="hidden text-muted-foreground sm:inline">Código</span>
            <span className="font-display text-base tracking-[0.2em] text-primary sm:text-lg sm:tracking-[0.3em]">
              {room.code}
            </span>
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          </button>
          <button
            onClick={shareInvite}
            className="surface-panel flex shrink-0 items-center gap-2 px-3 py-2 text-sm coarse:min-h-11"
            title="Compartir enlace de invitación"
          >
            <Share2 className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">Invitar</span>
          </button>
        </div>

      </header>

      {/* Marcador */}
      <div className="mt-6 flex flex-wrap gap-2">
        {players.map((p) => (
          <div
            key={p.user_id}
            className={cn(
              "surface-panel flex min-w-0 items-center gap-2 px-3 py-2 text-sm",
              round?.storyteller_id === p.user_id && "ring-1 ring-primary",
            )}
          >
            {room.host_id === p.user_id && <Crown className="h-3.5 w-3.5 shrink-0 text-primary" />}
            <span className="min-w-0 truncate">
              {labelOf(p)}
            </span>
            <span className="shrink-0 font-display text-primary">{p.score}</span>
          </div>
        ))}
      </div>

      {/* Resumen de la sala (antes de empezar) */}
      {room.status === "lobby" && (
        <section className="surface-panel mt-6 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl">Resumen de la sala</h2>
            <span className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              Esperando a que empiece la partida
            </span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Modo de juego</p>
              <p className="mt-1 flex items-center gap-2 font-display text-lg">
                <Layers className="h-4 w-4 text-primary" />
                {isShared ? "Mazo común" : "Personal"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {isShared
                  ? "Todos aportan fotos y se reparten 6 al azar a cada uno."
                  : "Cada jugador juega con las fotos de su propia galería."}
              </p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Jugadores conectados
              </p>
              <p className="mt-1 font-display text-lg">
                {players.length} {players.length === 1 ? "jugador" : "jugadores"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {players.length < 3
                  ? `Faltan ${3 - players.length} para poder empezar (mínimo 3).`
                  : "¡Ya sois suficientes para jugar!"}
              </p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Estado</p>
              <p className="mt-1 font-display text-lg">En el vestíbulo</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {isHost
                  ? "Cuando estéis listos, pulsa «Empezar partida»."
                  : `El anfitrión (${nameOf(room.host_id)}) iniciará la partida.`}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {players.map((p) => (
              <span
                key={p.user_id}
                className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm"
              >
                {room.host_id === p.user_id && <Crown className="h-3 w-3 text-primary" />}
                {labelOf(p)}
              </span>
            ))}
          </div>
        </section>
      )}


      {/* Mano / subida de cartas */}
      <section className={cn("surface-panel mt-6 p-5", room.status === "finished" && "hidden")}>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl">
              {isShared
                ? room.status === "lobby"
                  ? "Tus aportaciones al mazo"
                  : "Tus cartas"
                : "Tu galería"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isShared
                ? "Sube fotos al mazo común. Al empezar recibirás 6 cartas al azar de todo el grupo."
                : "En cada ronda eliges libremente cualquier foto de tu galería. No hace falta preparar un mazo antes de empezar."}
            </p>
          </div>
          <div className="shrink-0">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={uploading || (isShared && room.status !== "lobby")}
              className="rounded-full coarse:min-h-11"
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="mr-2 h-4 w-4" />
              )}
              {isShared ? "Aportar fotos" : "Añadir fotos"}
            </Button>
          </div>
        </div>

        {isShared && room.status === "lobby" && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Mazos guardados:</span>
            {decks.length === 0 ? (
              <Link to="/mazos" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                Crear mi primer mazo
              </Link>
            ) : (
              <>
                {decks.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    disabled={uploading || d.count === 0}
                    onClick={() => void importDeck(d.id)}
                    className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm transition hover:bg-secondary disabled:opacity-50 coarse:min-h-11 coarse:px-4"
                  >
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    {d.name}
                    <span className="text-muted-foreground">{d.count}</span>
                  </button>
                ))}
                <Link to="/mazos" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
                  Gestionar mazos
                </Link>
              </>
            )}
          </div>
        )}

        {!isShared && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>
              Tu galería incluye todas las fotos de tus mazos guardados y las que subas aquí.
            </span>
            <Link to="/mazos" className="font-medium text-primary underline-offset-4 hover:underline">
              Gestionar mi galería
            </Link>
          </div>
        )}

        {isShared && (
          <p className="mt-4 text-sm text-muted-foreground">
            Mazo común: <span className="text-primary">{poolTotal}</span> fotos sin repartir · tú has
            aportado <span className="text-primary">{pool.length}</span>. Hacen falta{" "}
            {players.length * 6} para empezar.
          </p>
        )}

        {hand.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            {isShared
              ? "Todavía no tienes cartas: se reparten cuando el anfitrión empieza la partida."
              : "Tu galería está vacía. Añade fotos aquí o guárdalas en un mazo para tenerlas siempre disponibles."}
          </p>
        ) : room.status === "playing" ? (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setCarouselOpen(true)}
              variant={canPickCard ? "default" : "secondary"}
              className="rounded-full coarse:min-h-11"
            >
              {canPickCard
                ? isShared
                  ? "Elegir mi carta"
                  : "Abrir mi galería"
                : isShared
                  ? "Ver mis cartas"
                  : "Ver mi galería"}
              <span className="ml-2 rounded-full bg-background/20 px-2 py-0.5 text-xs">
                {hand.length}
              </span>
            </Button>
            {isShared && (
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                Descartes: {discardsLeft}/{MAX_DISCARDS}
              </span>
            )}
            <p className="text-xs text-muted-foreground">
              {canPickCard
                ? isShared
                  ? "Revisa tus cartas en grande y confirma tu elección."
                  : "Navega por toda tu galería y confirma la foto de esta ronda."
                : "Puedes revisar tus fotos en cualquier momento."}
            </p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {hand.map((c) => (
              <div key={c.id} className="group relative">
                <div className="card-tile block aspect-[2/3] w-full">
                  <SignedImage path={c.image_path} alt="Foto de tu galería" className="h-full w-full" />
                </div>
                {room.status === "lobby" && !isShared && c.cardId && (
                  <button
                    type="button"
                    onClick={() => removeCard(c)}
                    className="absolute top-1 right-1 rounded-full bg-background/80 p-2 opacity-0 transition group-hover:opacity-100 coarse:opacity-100"
                    aria-label="Quitar carta"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {isShared && room.status === "lobby" && pool.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {pool.map((c) => (
              <div key={c.id} className="group relative">
                <div className="card-tile block aspect-[2/3] w-full opacity-90">
                  <SignedImage path={c.image_path} alt="Foto aportada al mazo" className="h-full w-full" />
                </div>
                <button
                  type="button"
                  onClick={() => removeCard(c)}
                  className="absolute top-1 right-1 rounded-full bg-background/80 p-2 opacity-0 transition group-hover:opacity-100 coarse:opacity-100"
                  aria-label="Quitar foto del mazo común"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Lobby */}
      {room.status === "lobby" && (
        <section className="surface-panel mt-6 p-6 text-center">
          <h2 className="text-2xl">Sala de espera</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {players.length} jugador{players.length === 1 ? "" : "es"} en la sala. Comparte el
            código <span className="text-primary">{room.code}</span> para que entren más.
          </p>
          {isHost ? (
            <Button
              onClick={startGame}
              disabled={busy || players.length < 3}
              className="mt-6 w-full rounded-full px-8 sm:w-auto coarse:min-h-11"
            >
              Empezar partida
            </Button>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">
              Esperando a que el anfitrión empiece la partida…
            </p>
          )}
        </section>
      )}


      {/* Partida */}
      {room.status === "playing" && round && (
        <section className="surface-panel mt-6 p-5 sm:p-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 sm:flex sm:flex-wrap sm:justify-between">
            <h2 className="text-xl sm:text-2xl">Ronda {round.number}</h2>
            <p className="text-sm text-muted-foreground">{phaseLabel(round.phase)}</p>
          </div>
          <p className="mt-2 text-sm">
            Narrador: <span className="text-primary">{nameOf(round.storyteller_id)}</span>
          </p>
          {round.clue && (
            <ClueBanner
              className="mt-4"
              clue={round.clue}
              storytellerName={nameOf(round.storyteller_id)}
              storytellerAvatar={players.find((p) => p.user_id === round.storyteller_id)?.avatar}
              startedAt={round.phase === "submit" ? round.clue_at : null}
            />
          )}

          {round.phase === "clue" &&
            (isStoryteller ? (
              <div className="mt-6 flex flex-col items-start gap-3">
                <p className="text-sm text-muted-foreground">
                  Eres el narrador: elige una foto {isShared ? "de tu mano" : "de tu galería"} y
                  escribe la pista.
                </p>
                <Button
                  onClick={() => setCarouselOpen(true)}
                  className="rounded-full coarse:min-h-11"
                >
                  Elegir carta y escribir pista
                </Button>
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">
                Esperando la pista del narrador…
              </p>
            ))}

          {round.phase === "submit" && (
            <div className="mt-6">
              {isStoryteller ? (
                <p className="text-sm text-muted-foreground">
                  Esperando a que el resto elija su carta ({submissions.length}/{players.length}).
                </p>
              ) : mySubmission ? (
                <p className="text-sm text-muted-foreground">
                  Carta enviada. Faltan {players.length - submissions.length} jugadores.
                </p>
              ) : (
                <div className="flex flex-col items-start gap-3">
                  <p className="text-sm text-muted-foreground">
                    Elige {isShared ? "de tu mano" : "de tu galería"} la foto que mejor encaje con
                    la pista.
                  </p>
                  <Button
                    onClick={() => setCarouselOpen(true)}
                    className="rounded-full coarse:min-h-11"
                  >
                    Elegir mi carta
                  </Button>
                </div>
              )}
              {isHost && (
                <Button
                  onClick={goToVoting}
                  disabled={busy || !allSubmitted}
                  variant="secondary"
                  className="mt-4 w-full rounded-full sm:w-auto coarse:min-h-11"
                >
                  Pasar a votación
                </Button>
              )}
            </div>
          )}

          {(round.phase === "vote" || round.phase === "reveal") && (
            <div className="mt-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {shuffled.map((s) => {
                  const isMine = s.player_id === user?.id;
                  const canVote = round.phase === "vote" && !isStoryteller && !myVote && !isMine;
                  const cardVotes = votes.filter((v) => v.submission_id === s.id);
                  return (
                    <div key={s.id} className="relative">
                      <button
                        type="button"
                        disabled={!canVote || busy}
                        onClick={() => setPendingVote(s.id)}
                        aria-pressed={pendingVote === s.id}
                        className={cn(
                          "card-tile relative block aspect-[2/3] w-full",
                          pendingVote === s.id &&
                            "card-tile-active ring-2 ring-primary ring-offset-2 ring-offset-background",
                          myVote?.submission_id === s.id && "card-tile-active ring-2 ring-primary",
                          round.phase === "reveal" &&
                            s.is_storyteller &&
                            "ring-2 ring-primary card-tile-active",
                        )}
                      >
                        <SignedImage path={s.image_path} alt="Carta jugada" className="h-full w-full" />
                        {pendingVote === s.id && !myVote && (
                          <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                      </button>
                      <ReactionOverlay bursts={bursts.filter((b) => b.targetId === s.id)} />
                      <ReactionPicker
                        className="absolute bottom-2 right-2 z-20"
                        onReact={(emoji) => react(s.id, emoji)}
                      />
                      {round.phase === "reveal" && (
                        <p className="mt-1 break-words text-xs text-muted-foreground">
                          {s.is_storyteller ? "★ " : ""}
                          {nameOf(s.player_id)}
                          {cardVotes.length > 0 &&
                            ` · ${cardVotes.map((v) => nameOf(v.voter_id)).join(", ")}`}
                        </p>
                      )}
                    </div>

                  );
                })}
              </div>

              {round.phase === "vote" && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Votos: {votes.length}/{votersNeeded}
                  {isStoryteller && " · Tú no votas esta ronda."}
                  {myVote && !isStoryteller && " · Ya has votado."}
                  {!isStoryteller && !myVote &&
                    (pendingVote
                      ? " · Pulsa «Confirmar voto» para dejarlo definitivo."
                      : " · Toca la carta que creas del narrador para seleccionarla.")}
                </p>
              )}

              {round.phase === "vote" && !isStoryteller && !myVote && (
                <Button
                  onClick={() => pendingVote && vote(pendingVote)}
                  disabled={busy || !pendingVote}
                  className="mt-4 w-full rounded-full py-6 text-base font-semibold sm:w-auto sm:px-8"
                >
                  <Check className="mr-2 h-5 w-5" />
                  Confirmar voto
                </Button>
              )}

              {round.phase === "reveal" && storySub && (
                <p className="mt-4 text-sm">
                  La carta del narrador era la marcada con ★ de{" "}
                  <span className="text-primary">{nameOf(storySub.player_id)}</span>.
                </p>
              )}

              {round.phase === "reveal" && (
                <div className="mt-6 rounded-2xl border border-border bg-background/40 p-4 sm:p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-display text-lg sm:text-xl">
                      Clasificación tras la ronda {round.number}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      Objetivo: {WIN_SCORE} puntos
                    </span>
                  </div>
                  <div className="mt-4">
                    <ScoreBoard rows={scoreRows} goal={WIN_SCORE} />
                  </div>
                  {gameOver && (
                    <p className="mt-3 text-center text-sm text-primary">
                      ¡Alguien ha alcanzado los {WIN_SCORE} puntos! La partida termina aquí.
                    </p>
                  )}
                </div>
              )}

              {isHost && round.phase === "vote" && (
                <Button
                  onClick={reveal}
                  disabled={busy || !allVoted}
                  className="mt-4 w-full rounded-full sm:w-auto coarse:min-h-11"
                >
                  Revelar y puntuar
                </Button>
              )}
              {isHost && round.phase === "reveal" && (
                <Button
                  onClick={nextRound}
                  disabled={busy}
                  className="mt-4 w-full rounded-full sm:w-auto coarse:min-h-11"
                >
                  {gameOver ? "Ver clasificación final" : "Siguiente ronda"}
                </Button>
              )}
              {!isHost && round.phase === "reveal" && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {gameOver
                    ? "Esperando a que el anfitrión muestre la clasificación final…"
                    : "Esperando a que el anfitrión inicie la siguiente ronda…"}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Final de la partida */}
      {room.status === "finished" && (
        <section className="surface-panel mt-6 p-6 sm:p-8">
          <Podium
            players={players.map((p) => ({
              id: p.user_id,
              name: labelOf(p),
              score: p.score,
              isMe: p.user_id === user?.id,
            }))}
          />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/jugar"
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground coarse:min-h-11"
            >
              Jugar otra partida
            </Link>
            <Link
              to="/"
              className="rounded-full border border-border px-6 py-2.5 text-sm coarse:min-h-11"
            >
              Volver al inicio
            </Link>
          </div>
        </section>
      )}


      {/* Carrusel a pantalla completa para revisar/elegir cartas */}
      {carouselOpen && hand.length > 0 && (
        <HandCarousel
          cards={hand}
          busy={busy}
          confirmLabel={
            canPickCard
              ? round?.phase === "clue"
                ? "Enviar pista con esta carta"
                : "Confirmar carta"
              : undefined
          }
          confirmDisabled={busy || (round?.phase === "clue" && !clue.trim())}
          onConfirm={async (card) => {
            if (!canPickCard || !round) return false;
            if (round.phase === "clue") await submitClue(card);
            else await submitCard(card);
            return true;
          }}
          discardsLeft={canDiscard || (isShared && room.status === "playing") ? discardsLeft : undefined}
          maxDiscards={MAX_DISCARDS}
          onDiscard={isShared && room.status === "playing" ? discardCard : undefined}
          onClose={() => setCarouselOpen(false)}
          header={
            round?.clue ? (
              <ClueBanner
                clue={round.clue}
                storytellerName={nameOf(round.storyteller_id)}
                storytellerAvatar={players.find((p) => p.user_id === round.storyteller_id)?.avatar}
                startedAt={round.phase === "submit" ? round.clue_at : null}
              />
            ) : null
          }
        >
          {canPickCard && round?.phase === "clue" && (
            <Input
              value={clue}
              onChange={(e) => setClue(e.target.value)}
              placeholder="Una palabra, una frase, una canción…"
              className="bg-card"
            />
          )}
        </HandCarousel>
      )}
    </div>
  );
}
