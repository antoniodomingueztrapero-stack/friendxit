-- Tiempos por defecto de la partida (pista / cartas / votos).
ALTER TABLE public.rooms
  ALTER COLUMN clue_seconds SET DEFAULT 70,
  ALTER COLUMN submit_seconds SET DEFAULT 50,
  ALTER COLUMN vote_seconds SET DEFAULT 40;

-- Borrador de pista del narrador: sirve para completarla si se agota el tiempo.
ALTER TABLE public.rounds
  ADD COLUMN IF NOT EXISTS clue_draft text;

-- Elige una carta jugable del jugador (mazo común o galería personal).
CREATE OR REPLACE FUNCTION public._pick_playable_card(
  _room_id uuid,
  _player_id uuid,
  _round_id uuid,
  _shared boolean
)
RETURNS TABLE (card_id uuid, image_path text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _shared THEN
    RETURN QUERY
    SELECT c.id, c.image_path
    FROM public.cards c
    WHERE c.room_id = _room_id
      AND c.holder_id = _player_id
      AND c.played = false
    ORDER BY random()
    LIMIT 1;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT c.id, c.image_path
  FROM public.cards c
  WHERE c.room_id = _room_id
    AND c.owner_id = _player_id
    AND NOT EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.round_id = _round_id AND s.image_path = c.image_path
    )
  ORDER BY random()
  LIMIT 1;

  IF FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT NULL::uuid, d.image_path
  FROM public.deck_cards d
  WHERE d.user_id = _player_id
    AND NOT EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.round_id = _round_id AND s.image_path = d.image_path
    )
  ORDER BY random()
  LIMIT 1;
END;
$$;

-- Avanza de fase: por tiempo agotado (cualquier miembro) o forzado por el anfitrión.
-- En pista/selección completa cartas al azar de quien no haya actuado.
CREATE OR REPLACE FUNCTION public.advance_round_phase(
  _room_id uuid,
  _force boolean DEFAULT false,
  _auto_clue text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  r public.rooms%ROWTYPE;
  rnd public.rounds%ROWTYPE;
  now_ts timestamptz := now();
  elapsed_s integer;
  limit_s integer;
  missing uuid;
  picked record;
  clue_text text;
  default_clue constant text := 'El glorioso desastre de un calcetín perdido en modo épico';
  submitted_story boolean;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Inicia sesión para continuar';
  END IF;

  SELECT * INTO r FROM public.rooms WHERE id = _room_id;
  IF r.id IS NULL THEN
    RAISE EXCEPTION 'Sala no encontrada';
  END IF;
  IF NOT public.is_room_member(_room_id, uid) THEN
    RAISE EXCEPTION 'No perteneces a esta sala';
  END IF;
  IF r.status <> 'playing' THEN
    RAISE EXCEPTION 'La partida no está en curso';
  END IF;

  SELECT * INTO rnd
  FROM public.rounds
  WHERE room_id = _room_id
  ORDER BY number DESC
  LIMIT 1
  FOR UPDATE;

  IF rnd.id IS NULL THEN
    RAISE EXCEPTION 'No hay ronda activa';
  END IF;

  IF rnd.phase IN ('reveal', 'finished') THEN
    RETURN rnd.phase;
  END IF;

  elapsed_s := FLOOR(EXTRACT(EPOCH FROM (now_ts - COALESCE(rnd.phase_started_at, rnd.created_at))))::integer;
  limit_s := CASE rnd.phase
    WHEN 'clue' THEN r.clue_seconds
    WHEN 'submit' THEN r.submit_seconds
    WHEN 'vote' THEN r.vote_seconds
    ELSE 0
  END;

  IF _force THEN
    IF r.host_id <> uid THEN
      RAISE EXCEPTION 'Solo el anfitrión puede forzar la siguiente fase';
    END IF;
  ELSE
    IF NOT r.timers_enabled THEN
      RAISE EXCEPTION 'Los temporizadores están desactivados';
    END IF;
    IF elapsed_s < limit_s THEN
      RAISE EXCEPTION 'Aún queda tiempo en esta fase';
    END IF;
  END IF;

  IF rnd.phase = 'clue' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.round_id = rnd.id AND s.is_storyteller
    ) INTO submitted_story;

    IF NOT submitted_story THEN
      SELECT * INTO picked
      FROM public._pick_playable_card(_room_id, rnd.storyteller_id, rnd.id, r.mode = 'shared');

      IF picked.image_path IS NULL THEN
        RAISE EXCEPTION 'El narrador no tiene cartas para jugar';
      END IF;

      clue_text := NULLIF(btrim(COALESCE(_auto_clue, '')), '');
      IF clue_text IS NULL THEN
        clue_text := NULLIF(btrim(COALESCE(rnd.clue_draft, '')), '');
      END IF;
      IF clue_text IS NULL THEN
        clue_text := default_clue;
      END IF;

      INSERT INTO public.submissions (round_id, room_id, player_id, card_id, image_path, is_storyteller)
      VALUES (rnd.id, _room_id, rnd.storyteller_id, picked.card_id, picked.image_path, true);

      IF r.mode = 'shared' AND picked.card_id IS NOT NULL THEN
        UPDATE public.cards SET played = true WHERE id = picked.card_id;
      END IF;

      UPDATE public.rounds
      SET
        clue = clue_text,
        clue_at = now_ts,
        phase_started_at = now_ts,
        phase = 'submit',
        clue_auto = true
      WHERE id = rnd.id;

      RETURN 'submit';
    END IF;

    UPDATE public.rounds
    SET
      phase = 'submit',
      clue_at = COALESCE(clue_at, now_ts),
      phase_started_at = now_ts
    WHERE id = rnd.id AND phase = 'clue';
    RETURN 'submit';
  END IF;

  IF rnd.phase = 'submit' THEN
    FOR missing IN
      SELECT rp.user_id
      FROM public.room_players rp
      WHERE rp.room_id = _room_id
        AND NOT EXISTS (
          SELECT 1 FROM public.submissions s
          WHERE s.round_id = rnd.id AND s.player_id = rp.user_id
        )
    LOOP
      SELECT * INTO picked
      FROM public._pick_playable_card(_room_id, missing, rnd.id, r.mode = 'shared');
      IF picked.image_path IS NULL THEN
        CONTINUE;
      END IF;
      INSERT INTO public.submissions (round_id, room_id, player_id, card_id, image_path, is_storyteller)
      VALUES (rnd.id, _room_id, missing, picked.card_id, picked.image_path, false);
      IF r.mode = 'shared' AND picked.card_id IS NOT NULL THEN
        UPDATE public.cards SET played = true WHERE id = picked.card_id;
      END IF;
    END LOOP;

    UPDATE public.rounds
    SET phase = 'vote', vote_at = now_ts, phase_started_at = now_ts
    WHERE id = rnd.id AND phase = 'submit';
    RETURN 'vote';
  END IF;

  IF rnd.phase = 'vote' THEN
    -- La puntuación se aplica en el cliente para reutilizar computeScores.
    RETURN 'reveal-pending';
  END IF;

  RETURN rnd.phase;
END;
$$;

REVOKE ALL ON FUNCTION public._pick_playable_card(uuid, uuid, uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._pick_playable_card(uuid, uuid, uuid, boolean) TO service_role;

REVOKE ALL ON FUNCTION public.advance_round_phase(uuid, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.advance_round_phase(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_round_phase(uuid, boolean, text) TO service_role;
