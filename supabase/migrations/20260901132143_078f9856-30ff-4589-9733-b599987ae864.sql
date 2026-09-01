ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS timers_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS clue_seconds integer NOT NULL DEFAULT 80,
  ADD COLUMN IF NOT EXISTS submit_seconds integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS vote_seconds integer NOT NULL DEFAULT 40;

ALTER TABLE public.rooms
  ADD CONSTRAINT rooms_clue_seconds_range CHECK (clue_seconds BETWEEN 15 AND 600),
  ADD CONSTRAINT rooms_submit_seconds_range CHECK (submit_seconds BETWEEN 15 AND 600),
  ADD CONSTRAINT rooms_vote_seconds_range CHECK (vote_seconds BETWEEN 10 AND 600);

ALTER TABLE public.rounds
  ADD COLUMN IF NOT EXISTS phase_started_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS vote_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS clue_auto boolean NOT NULL DEFAULT false;