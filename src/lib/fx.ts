/**
 * Efectos del juego: sonidos sintetizados con el navegador (sin archivos),
 * confeti, vibración y utilidades de ánimo.
 *
 * Todo es opcional: si el navegador no soporta algo, se ignora en silencio.
 */

const isClient = () => typeof window !== "undefined";

const prefersReducedMotion = () =>
  isClient() && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* ---------------- Vibrar ---------------- */

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
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx ??= new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Tono corto: la base de casi todos los efectos. */
function tone(
  freq: number,
  at: number,
  duration = 0.18,
  gain = 0.05,
  type: OscillatorType = "sine",
  slideTo?: number,
) {
  const ac = audio();
  if (!ac) return;
  try {
    const t0 = ac.currentTime + at;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + duration);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  } catch {
    /* noop */
  }
}

/** Ruido filtrado: sirve para aplausos, redobles, soplos y golpes. */
function noise(
  at: number,
  duration: number,
  opts: {
    gain?: number;
    type?: BiquadFilterType;
    freq?: number;
    sweepTo?: number;
    q?: number;
  } = {},
) {
  const ac = audio();
  if (!ac) return;
  try {
    const t0 = ac.currentTime + at;
    const frames = Math.max(1, Math.floor(ac.sampleRate * duration));
    const buffer = ac.createBuffer(1, frames, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buffer;

    const filter = ac.createBiquadFilter();
    filter.type = opts.type ?? "bandpass";
    filter.frequency.setValueAtTime(opts.freq ?? 1200, t0);
    if (opts.sweepTo) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(60, opts.sweepTo), t0 + duration);
    }
    filter.Q.value = opts.q ?? 0.8;

    const g = ac.createGain();
    const peak = opts.gain ?? 0.05;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.05, duration * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    src.connect(filter).connect(g).connect(ac.destination);
    src.start(t0);
    src.stop(t0 + duration + 0.02);
  } catch {
    /* noop */
  }
}

/** Vista previa de una carta / confirmar algo. */
export function sfxClick() {
  tone(760, 0, 0.06, 0.03, "triangle");
  noise(0, 0.05, { type: "highpass", freq: 2200, gain: 0.02 });
}

/** Reloj: cada segundo cuando queda poco tiempo. Más agudo y fuerte si es urgente. */
export function sfxTickTock(urgent = false) {
  tone(urgent ? 1250 : 940, 0, 0.045, urgent ? 0.05 : 0.022, "square");
  if (urgent) haptic(5);
}

/** Fanfarria corta al empezar tu turno como narrador. */
export function sfxClue() {
  tone(523.25, 0, 0.14, 0.05, "triangle");
  tone(659.25, 0.11, 0.14, 0.05, "triangle");
  tone(880, 0.22, 0.3, 0.055, "triangle");
  noise(0.22, 0.3, { type: "highpass", freq: 3000, gain: 0.014 });
  haptic([12, 30, 22]);
}

/** Pasar una carta, destaparla. */
export function sfxWhoosh() {
  noise(0, 0.32, { type: "bandpass", freq: 420, sweepTo: 2800, gain: 0.05, q: 1.1 });
}

/** Redoble de tambor para el momento clave. */
export function sfxDrumroll(ms = 1600) {
  const beats = Math.min(60, Math.max(6, Math.round(ms / 45)));
  for (let i = 0; i < beats; i++) {
    const progress = i / beats;
    noise(i * 0.045, 0.05, {
      freq: 1150 + progress * 500,
      gain: 0.014 + progress * 0.022,
      q: 0.7,
    });
  }
  // Golpe final
  noise(ms / 1000, 0.22, { type: "lowpass", freq: 700, gain: 0.075 });
  tone(160, ms / 1000, 0.22, 0.06, "sine", 60);
  haptic([10, 40, 30]);
}

/** Sello del narrador: golpe seco de tampón. */
export function sfxStamp() {
  tone(190, 0, 0.14, 0.11, "sine", 60);
  noise(0, 0.14, { type: "lowpass", freq: 520, gain: 0.07 });
  haptic([14, 30, 20]);
}

/** Aplausos: cuando alguien acierta. */
export function sfxApplause() {
  for (let i = 0; i < 26; i++) {
    const at = i * 0.038 + Math.random() * 0.02;
    const fade = 1 - i / 40;
    noise(at, 0.055, { type: "highpass", freq: 1600 + Math.random() * 900, gain: 0.03 * fade });
  }
  haptic([8, 25, 8, 25, 20]);
}

/** "Ohhh" de decepción: cuando no acierta nadie. */
export function sfxOhhh() {
  tone(392, 0, 0.34, 0.045, "triangle");
  tone(311, 0.17, 0.42, 0.045, "triangle");
  tone(262, 0.36, 0.7, 0.045, "triangle", 180);
  noise(0.02, 0.9, { type: "lowpass", freq: 900, gain: 0.02 });
}

/** Subida de puntos. */
export function sfxScoreUp() {
  tone(659.25, 0, 0.14, 0.04);
  tone(987.77, 0.1, 0.28, 0.035);
  haptic([10, 30, 18]);
}

/** Tic mientras se cuentan los puntos. */
export function sfxTick(step = 0) {
  tone(660 + Math.min(step, 8) * 40, 0, 0.06, 0.022);
}

/** Al revelar las cartas. */
export function sfxReveal() {
  tone(523.25, 0, 0.16, 0.04);
  tone(783.99, 0.09, 0.22, 0.035);
  haptic([8, 40, 12]);
}

/** Fanfarria final del podio. */
export function sfxWin() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.12, 0.3, 0.045));
  haptic([15, 40, 15, 40, 40]);
}

/* ---------------- Reacciones con emojis ---------------- */

/** Cada emoji tiene su propio sonido graciosete. `remote` suena más flojito. */
export function sfxReaction(emoji: string, remote = false) {
  const v = remote ? 0.65 : 1;
  switch (emoji) {
    case "😂":
      // Risita: rebotes cortos que suben.
      [0, 0.09, 0.18, 0.29].forEach((at, i) => tone(520 + i * 90, at, 0.09, 0.045 * v, "triangle"));
      break;
    case "🤣":
      // Carcajada larga y temblorosa.
      [0, 0.07, 0.14, 0.21, 0.29, 0.38].forEach((at, i) =>
        tone(480 + (i % 3) * 70, at, 0.1, 0.04 * v, "sawtooth"),
      );
      break;
    case "😱":
      // Grito: sube y tiembla.
      tone(420, 0, 0.5, 0.05 * v, "sawtooth", 1500);
      break;
    case "😮":
      // Sorpresa: nota que cae.
      tone(900, 0, 0.3, 0.045 * v, "sine", 380);
      break;
    case "🤯":
      // Cabeza explotando: bomba.
      noise(0, 0.34, { type: "lowpass", freq: 1400, sweepTo: 200, gain: 0.07 * v });
      tone(150, 0, 0.3, 0.07 * v, "sine", 50);
      break;
    case "🔥":
      // Soplete.
      noise(0, 0.45, { type: "bandpass", freq: 900, sweepTo: 2600, gain: 0.045 * v, q: 0.6 });
      break;
    case "👀":
      // Doble "tss-tss" de sospecha.
      noise(0, 0.07, { type: "highpass", freq: 2600, gain: 0.035 * v });
      noise(0.16, 0.07, { type: "highpass", freq: 2200, gain: 0.035 * v });
      break;
    case "🤡":
      // Claxon de payaso.
      tone(330, 0, 0.16, 0.05 * v, "square", 420);
      tone(300, 0.18, 0.22, 0.05 * v, "square", 250);
      break;
    case "💩":
      // Chapuzón.
      tone(320, 0, 0.22, 0.055 * v, "sine", 90);
      noise(0, 0.16, { type: "lowpass", freq: 800, gain: 0.035 * v });
      break;
    case "🫠":
      // Silbato deslizante cuesta abajo.
      tone(1100, 0, 0.55, 0.045 * v, "sine", 220);
      break;
    default:
      tone(700, 0, 0.12, 0.04 * v, "triangle", 1000);
      break;
  }
  if (!remote) haptic(8);
}

/* ---------------- Confeti ---------------- */

const COLORS = ["#c8552f", "#f2c14e", "#3f7787", "#faf3e3", "#2f2d3a"];

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

/** Celebración grande (podio, sello del narrador). */
export function confettiBurst(origin: { x: number; y: number } = { x: 0.5, y: 0.4 }) {
  void fire({ particleCount: 70, spread: 85, startVelocity: 38, scalar: 0.85, origin });
}

/** Celebración del podio final. */
export function confettiWin() {
  void fire({
    particleCount: 90,
    spread: 100,
    startVelocity: 45,
    scalar: 0.9,
    origin: { x: 0.5, y: 0.4 },
  });
  setTimeout(
    () => void fire({ particleCount: 60, angle: 60, spread: 70, origin: { x: 0, y: 0.7 } }),
    220,
  );
  setTimeout(
    () => void fire({ particleCount: 60, angle: 120, spread: 70, origin: { x: 1, y: 0.7 } }),
    380,
  );
}
