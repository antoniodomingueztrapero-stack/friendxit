/**
 * Efectos sutiles: confeti, sonidos cortos y microvibración.
 * Todo es opcional y silencioso si el navegador no lo soporta.
 */

const isClient = () => typeof window !== "undefined";

const prefersReducedMotion = () =>
  isClient() && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* ---------------- Haptics ---------------- */

export function haptic(pattern: number | number[] = 10) {
  if (!isClient()) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* noop */
  }
}

/* ---------------- Audio ---------------- */

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (!isClient()) return null;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx ??= new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Tono corto y suave. */
function tone(freq: number, at: number, duration = 0.18, gain = 0.05) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + at;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

/** Al revelar las cartas. */
export function sfxReveal() {
  tone(523.25, 0, 0.16, 0.04);
  tone(783.99, 0.09, 0.22, 0.035);
  haptic([8, 40, 12]);
}

/** Un "tick" mientras suben los puntos. */
export function sfxTick(step = 0) {
  tone(660 + Math.min(step, 8) * 40, 0, 0.06, 0.022);
}

/** Cuando termina de sumar la puntuación. */
export function sfxScoreUp() {
  tone(659.25, 0, 0.14, 0.04);
  tone(987.77, 0.1, 0.28, 0.035);
  haptic([10, 30, 18]);
}

/** Fanfarria final del podio. */
export function sfxWin() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.12, 0.3, 0.045));
  haptic([15, 40, 15, 40, 40]);
}

/* ---------------- Confeti ---------------- */

const COLORS = ["#f4c14b", "#e8d6b3", "#c9d1dc", "#cd8a4e"];

async function fire(options: Record<string, unknown>) {
  if (!isClient() || prefersReducedMotion()) return;
  try {
    const { default: confetti } = await import("canvas-confetti");
    void confetti({ colors: COLORS, disableForReducedMotion: true, ...options });
  } catch {
    /* noop */
  }
}

/** Ráfaga discreta (revelado de cartas / subida de puntos). */
export function confettiSubtle(origin: { x: number; y: number } = { x: 0.5, y: 0.35 }) {
  void fire({ particleCount: 40, spread: 60, startVelocity: 28, scalar: 0.7, ticks: 120, origin });
}

/** Celebración del podio final. */
export function confettiWin() {
  void fire({ particleCount: 90, spread: 100, startVelocity: 45, scalar: 0.9, origin: { x: 0.5, y: 0.4 } });
  setTimeout(() => void fire({ particleCount: 60, angle: 60, spread: 70, origin: { x: 0, y: 0.7 } }), 220);
  setTimeout(() => void fire({ particleCount: 60, angle: 120, spread: 70, origin: { x: 1, y: 0.7 } }), 380);
}
