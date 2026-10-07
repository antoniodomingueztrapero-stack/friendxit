import { useEffect, useMemo, useRef, useState } from "react";
import { FastForward } from "lucide-react";
import { SignedImage } from "@/components/SignedImage";
import { cn } from "@/lib/utils";
import {
  confettiBurst,
  confettiSubtle,
  sfxApplause,
  sfxDrumroll,
  sfxOhhh,
  sfxStamp,
  sfxWhoosh,
} from "@/lib/fx";

export type RevealSubmission = {
  id: string;
  player_id: string;
  image_path: string;
  is_storyteller: boolean;
};

export type RevealVote = { voter_id: string; submission_id: string };

export type RevealPlayer = { user_id: string; name: string; avatar?: string | null };

type Stage = "votes" | "drumroll" | "stamp" | "result" | "scores";

type Props = {
  roundId: string;
  roundNumber: number;
  submissions: RevealSubmission[];
  votes: RevealVote[];
  players: RevealPlayer[];
  storytellerId: string;
  myId: string | undefined;
  /** Puntos conseguidos esta ronda por quien mira la pantalla. */
  myDelta: number | null;
  /** La clasificación, que aparece cuando termina el suspense. */
  scoresNode: React.ReactNode;
  /** Avisa al resto de la sala de que ya se puede pasar de ronda. */
  onSettled: () => void;
};

function shortName(name: string) {
  return name.split(" ")[0] ?? name;
}

/**
 * Revelación con suspense: los votos caen uno a uno, redoble, sello del narrador
 * y por último tu resultado y la clasificación. Antes salía todo de golpe.
 */
export function RoundReveal({
  roundId,
  roundNumber,
  submissions,
  votes,
  players,
  storytellerId,
  myId,
  myDelta,
  scoresNode,
  onSettled,
}: Props) {
  const [stage, setStage] = useState<Stage>("votes");
  const [revealed, setRevealed] = useState(0);
  const timers = useRef<number[]>([]);
  const startedFor = useRef<string | null>(null);
  const settledRef = useRef(onSettled);
  settledRef.current = onSettled;
  const votesRef = useRef(votes);
  votesRef.current = votes;

  const playerOf = (id: string) => players.find((p) => p.user_id === id);
  const nameOf = (id: string) => playerOf(id)?.name ?? "Alguien";

  const storySub = submissions.find((s) => s.is_storyteller) ?? null;

  // Orden de los votos: primero los que fallan, para que el suspense suba.
  const orderedVotes = useMemo(() => {
    const voters = votes.filter((v) => v.voter_id !== storytellerId);
    return [...voters].sort((a, b) => {
      const aHit = storySub && a.submission_id === storySub.id ? 1 : 0;
      const bHit = storySub && b.submission_id === storySub.id ? 1 : 0;
      return aHit - bHit;
    });
  }, [votes, storytellerId, storySub]);

  useEffect(() => {
    if (startedFor.current === roundId) return;
    startedFor.current = roundId;
    setStage("votes");
    setRevealed(0);

    const total = votesRef.current.filter((v) => v.voter_id !== storytellerId).length;
    const ids: number[] = [];
    let t = 550;
    for (let i = 1; i <= total; i++) {
      ids.push(window.setTimeout(() => setRevealed(i), t));
      t += 950;
    }
    ids.push(window.setTimeout(() => setStage("drumroll"), t));
    t += 1800;
    ids.push(window.setTimeout(() => setStage("stamp"), t));
    t += 1200;
    ids.push(window.setTimeout(() => setStage("result"), t));
    t += 3000;
    ids.push(
      window.setTimeout(() => {
        setStage("scores");
        settledRef.current();
      }, t),
    );
    timers.current = ids;
    return () => {
      ids.forEach((id) => window.clearTimeout(id));
    };
  }, [roundId, storytellerId]);

  // Sonidos: uno al destapar cada voto, redoble, sello y cierre.
  useEffect(() => {
    if (revealed > 0) sfxWhoosh();
  }, [revealed]);

  useEffect(() => {
    if (stage === "stamp") confettiSubtle({ x: 0.5, y: 0.45 });
  }, [stage]);

  useEffect(() => {
    if (stage === "drumroll") sfxDrumroll(1800);
    if (stage === "stamp") sfxStamp();
  }, [stage]);

  const voters = votes.filter((v) => v.voter_id !== storytellerId);
  const hits = storySub ? voters.filter((v) => v.submission_id === storySub.id) : [];
  const noOneGuessed = !!storySub && voters.length > 0 && hits.length === 0;
  const everyoneGuessed = !!storySub && voters.length > 0 && hits.length === voters.length;
  const imStoryteller = myId === storytellerId;
  const myVote = votes.find((v) => v.voter_id === myId);
  const iGuessed = !!myVote && !!storySub && myVote.submission_id === storySub.id;
  const myCard = submissions.find((s) => s.player_id === myId);
  const votesOnMyCard =
    myCard && !myCard.is_storyteller ? votes.filter((v) => v.submission_id === myCard.id) : [];

  useEffect(() => {
    if (stage !== "result") return;
    if (noOneGuessed || everyoneGuessed) sfxOhhh();
    else sfxApplause();
  }, [stage, noOneGuessed, everyoneGuessed]);

  const skip = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    setRevealed(voters.length);
    setStage("scores");
    settledRef.current();
  };

  if (!storySub) return null;

  const finish = stage === "scores";
  const showStamp = stage === "stamp" || stage === "result" || finish;
  const showResult = stage === "result" || finish;
  const banner = (() => {
    if (stage === "votes") {
      const v = orderedVotes[revealed - 1];
      if (!v) return "Vamos a ver quién ha picado…";
      const target = submissions.find((s) => s.id === v.submission_id);
      return `${nameOf(v.voter_id)} votó la carta de ${target ? nameOf(target.player_id) : "alguien"}…`;
    }
    if (stage === "drumroll") return "Y la carta del narrador era…";
    return `La carta del narrador era la de ${nameOf(storySub.player_id)}`;
  })();

  return (
    <div className="mt-6">
      {/* Narración del suspense */}
      <div className="relative rounded-2xl border-2 border-ink bg-accent px-4 py-3 text-center shadow-ink-sm">
        <p
          className={cn(
            "font-display text-base font-extrabold text-accent-foreground sm:text-lg",
            stage === "drumroll" && "animate-pulse",
          )}
        >
          {stage === "drumroll" ? "🥁 " : ""}
          {banner}
        </p>
        {!finish && (
          <button
            onClick={skip}
            className="absolute top-1/2 right-2 hidden -translate-y-1/2 items-center gap-1.5 rounded-full border-2 border-ink bg-card px-3 py-1 text-xs font-bold shadow-ink-sm transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:flex"
          >
            <FastForward className="h-3.5 w-3.5" />
            Saltar
          </button>
        )}
      </div>

      {/* Las cartas, con sus votos cayendo uno a uno */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {submissions.map((s) => {
          const cardVotes = votes.filter((v) => v.submission_id === s.id);
          const shown = cardVotes.filter(
            (v) => orderedVotes.findIndex((o) => o.voter_id === v.voter_id) < revealed,
          );
          const isStory = s.is_storyteller;
          const dead = finish && cardVotes.length === 0 && !isStory;
          return (
            <div key={s.id} className={cn("transition-opacity duration-500", dead && "opacity-45")}>
              <div className="relative">
                <div
                  className={cn(
                    "card-tile relative aspect-[2/3] w-full",
                    isStory && showStamp && "ring-4 ring-destructive",
                  )}
                >
                  <SignedImage path={s.image_path} alt="Carta jugada" className="h-full w-full" />
                  {isStory && showStamp && (
                    <span className="absolute inset-0 flex items-center justify-center bg-background/45">
                      <span className="rotate-[-8deg] animate-scale-in rounded-xl border-4 border-destructive bg-background/90 px-2.5 py-1 text-center font-display text-[11px] leading-tight font-extrabold tracking-wider text-destructive uppercase sm:text-sm">
                        ★ La del
                        <br />
                        narrador
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-1.5 truncate text-center text-xs font-bold">
                {nameOf(s.player_id)}
                {s.player_id === myId && " (tú)"}
              </p>
              <div className="mt-1 flex flex-wrap justify-center gap-1">
                {shown.map((v) => {
                  const p = playerOf(v.voter_id);
                  return (
                    <span
                      key={v.voter_id}
                      className="flex animate-scale-in items-center gap-1 rounded-full border-2 border-ink bg-card px-1.5 py-0.5 text-[10px] font-bold shadow-ink-sm"
                    >
                      <span aria-hidden>{p?.avatar || "🙂"}</span>
                      {shortName(p?.name ?? "Alguien")}
                    </span>
                  );
                })}
                {shown.length > 1 && (
                  <span className="rounded-full bg-destructive/15 px-1.5 py-0.5 text-[10px] font-extrabold text-destructive">
                    ¡{shown.length} votos!
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tu resultado */}
      {showResult && (
        <div className="mt-6 animate-scale-in">
          <div
            className={cn(
              "rounded-3xl border-2 border-ink p-5 text-center shadow-ink",
              iGuessed || (imStoryteller && hits.length > 0 && !everyoneGuessed)
                ? "bg-accent"
                : "bg-card",
            )}
          >
            <p className="font-display text-2xl leading-tight font-extrabold sm:text-3xl">
              {imStoryteller
                ? noOneGuessed
                  ? "¡No ha acertado nadie!"
                  : everyoneGuessed
                    ? "¡Te han pillado todos!"
                    : `Han acertado ${hits.length} de ${voters.length}`
                : iGuessed
                  ? "¡Has acertado!"
                  : "Has picado"}
            </p>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              {imStoryteller
                ? noOneGuessed
                  ? "Han picado todos con otras cartas. No sumas puntos… pero qué risa."
                  : everyoneGuessed
                    ? "Pista demasiado fácil: todos te han pillado y no sumas."
                    : "Pista en su punto: +3 puntos."
                : iGuessed
                  ? `Era la de ${nameOf(storySub.player_id)}. +3 puntos.`
                  : `Era la de ${nameOf(storySub.player_id)}. Tú votaste otra.`}
            </p>
            {!imStoryteller && votesOnMyCard.length > 0 && (
              <p className="mt-1 text-sm font-semibold text-muted-foreground">
                Y {votesOnMyCard.length}{" "}
                {votesOnMyCard.length === 1 ? "persona votó" : "personas votaron"} tu carta: +
                {votesOnMyCard.length}.
              </p>
            )}
            {typeof myDelta === "number" && (
              <p className="font-hand mt-3 text-2xl text-primary">
                {myDelta > 0 ? `+${myDelta} puntos esta ronda` : "Sin puntos esta ronda"}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Clasificación (solo cuando termina el suspense) */}
      {finish && <div className="animate-scale-in">{scoresNode}</div>}

      <p className="mt-3 text-center text-xs font-bold text-muted-foreground">
        Ronda {roundNumber}
        {!finish && " · "}
        {!finish && (
          <button onClick={skip} className="underline underline-offset-2">
            saltar la revelación
          </button>
        )}
      </p>
    </div>
  );
}
