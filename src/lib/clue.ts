/**
 * Pistas automáticas cuando al narrador se le agota el tiempo.
 * Si ya había escrito algo, se completa de forma épica; si no, se genera
 * una combinación graciosa de palabras.
 */

const OPENERS = [
  "El misterio de",
  "La leyenda de",
  "Aquella noche de",
  "El último suspiro de",
  "Crónica secreta de",
  "El glorioso desastre de",
  "Oda a",
  "La venganza de",
];

const SUBJECTS = [
  "la abuela ninja",
  "el pulpo filósofo",
  "un calcetín perdido",
  "el bocadillo cósmico",
  "tres patos sospechosos",
  "el wifi del vecino",
  "una siesta interminable",
  "el gato que no pagaba alquiler",
  "el domingo por la tarde",
  "la última croqueta",
];

const TAILS = [
  "y nadie lo vio venir",
  "bajo la luna de agosto",
  "con final feliz (más o menos)",
  "mientras sonaba una canción triste",
  "en modo épico",
  "y todo cambió para siempre",
  "sin testigos ni pruebas",
  "a las tres de la madrugada",
];

const EPIC_ENDINGS = [
  "… y el destino sonrió",
  "… hasta el final de los tiempos",
  "… contra todo pronóstico",
  "… y así nació la leyenda",
  "… mientras el mundo aguantaba la respiración",
  "… con una elegancia inexplicable",
];

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)] as T;
}

/** Genera la pista automática. `partial` es lo que el narrador estuviese escribiendo. */
export function autoClue(partial?: string | null): string {
  const draft = (partial ?? "").trim();
  if (draft.length >= 2) {
    return `${draft}${pick(EPIC_ENDINGS)}`;
  }
  return `${pick(OPENERS)} ${pick(SUBJECTS)} ${pick(TAILS)}`;
}
