export type Submission = {
  id: string;
  player_id: string;
  is_storyteller: boolean;
};

export type Vote = {
  voter_id: string;
  submission_id: string;
};

export function generateRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

/**
 * Puntuación estilo Dixit.
 * - Si todos o nadie acierta la carta del narrador: narrador 0, el resto 2.
 * - Si no: narrador 3 y quien acierta 3.
 * - Cada jugador (no narrador) suma 1 por cada voto recibido en su carta.
 * Penalizaciones por tiempo:
 * - Si la pista la generó el temporizador, el narrador recibe 1 punto menos.
 * - Quien no llega a votar pierde 1 punto (el total nunca baja de 0).
 */
export function computeScores(
  submissions: Submission[],
  votes: Vote[],
  storytellerId: string,
  playerIds: string[],
  opts?: { clueAuto?: boolean },
): Record<string, number> {
  const delta: Record<string, number> = {};
  for (const id of playerIds) delta[id] = 0;

  const storySub = submissions.find((s) => s.is_storyteller);
  if (!storySub) return delta;

  const voters = votes.filter((v) => v.voter_id !== storytellerId);
  const correct = voters.filter((v) => v.submission_id === storySub.id);
  const total = voters.length;

  if (total > 0 && (correct.length === total || correct.length === 0)) {
    for (const id of playerIds) {
      if (id !== storytellerId) delta[id] = (delta[id] ?? 0) + 2;
    }
  } else {
    delta[storytellerId] = (delta[storytellerId] ?? 0) + 3;
    for (const v of correct) delta[v.voter_id] = (delta[v.voter_id] ?? 0) + 3;
  }

  for (const v of voters) {
    const sub = submissions.find((s) => s.id === v.submission_id);
    if (sub && !sub.is_storyteller) {
      delta[sub.player_id] = (delta[sub.player_id] ?? 0) + 1;
    }
  }

  // Penalización al narrador si la pista fue automática por tiempo.
  if (opts?.clueAuto) delta[storytellerId] = (delta[storytellerId] ?? 0) - 1;

  // Penalización a quien no votó (se le descuenta 1 punto).
  for (const id of playerIds) {
    if (id === storytellerId) continue;
    if (!votes.some((v) => v.voter_id === id)) delta[id] = (delta[id] ?? 0) - 1;
  }

  return delta;
}


export function phaseLabel(phase: string) {
  switch (phase) {
    case "clue":
      return "El narrador elige carta y pista";
    case "submit":
      return "Elegid vuestra carta";
    case "vote":
      return "Hora de votar";
    case "reveal":
      return "Resultados de la ronda";
    default:
      return "";
  }
}
