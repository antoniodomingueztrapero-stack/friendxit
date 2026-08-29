import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, Check, Trash2 } from "lucide-react";
import { SignedImage } from "@/components/SignedImage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CarouselCard = { id: string; image_path: string };

type Props = {
  cards: CarouselCard[];
  /** Índice inicial al abrir (p. ej. la carta ya seleccionada). */
  initialIndex?: number;
  /** Texto del botón de confirmación. Si no se pasa, el carrusel es solo de consulta. */
  confirmLabel?: string | undefined;
  /** Se llama al confirmar la carta visible. Debe devolver true si la elección quedó bloqueada. */
  onConfirm?: (card: CarouselCard) => Promise<boolean> | boolean;
  confirmDisabled?: boolean;
  busy?: boolean;
  /** Descartes disponibles (modo mazo común). Si es undefined, no se muestra el descarte. */
  discardsLeft?: number | undefined;
  maxDiscards?: number;
  /** Se llama al confirmar el descarte de la carta visible. */
  onDiscard?: ((card: CarouselCard) => Promise<void> | void) | undefined;
  /** Cabecera persistente (p. ej. la pista del narrador). */
  header?: React.ReactNode;
  /** Contenido extra sobre el botón de confirmar (p. ej. el campo de pista del narrador). */
  children?: React.ReactNode;
  onClose: () => void;
};

/**
 * Carrusel de cartas a pantalla completa: una carta protagonista,
 * navegación con flechas / deslizamiento táctil / teclado, contador 1/N
 * y confirmación opcional de la carta visible.
 */
export function HandCarousel({
  cards,
  initialIndex = 0,
  confirmLabel,
  onConfirm,
  confirmDisabled = false,
  busy = false,
  discardsLeft,
  maxDiscards = 3,
  onDiscard,
  header,
  children,
  onClose,
}: Props) {
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(initialIndex, 0), Math.max(cards.length - 1, 0)),
  );
  const [dragX, setDragX] = useState(0);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const axisLocked = useRef<"h" | "v" | null>(null);

  const goTo = useCallback(
    (i: number) => setIndex((prev) => Math.min(Math.max(i, 0), cards.length - 1) ?? prev),
    [cards.length],
  );
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);
  const next = useCallback(() => setIndex((i) => Math.min(i + 1, cards.length - 1)), [cards.length]);

  // Al cambiar de carta se cancela la confirmación de descarte
  useEffect(() => {
    setConfirmDiscard(false);
  }, [index]);

  // Navegación con teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, onClose]);

  // Bloquear el scroll del fondo mientras el carrusel está abierto
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    startX.current = t.clientX;
    startY.current = t.clientY;
    axisLocked.current = null;
    setDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    const t = e.touches[0];
    if (!t) return;
    const dx = t.clientX - startX.current;
    const dy = t.clientY - startY.current;
    if (!axisLocked.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axisLocked.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
    }
    if (axisLocked.current === "v") return;
    // Resistencia en los extremos
    const atStart = index === 0 && dx > 0;
    const atEnd = index === cards.length - 1 && dx < 0;
    setDragX(atStart || atEnd ? dx / 3 : dx);
  };

  const onTouchEnd = () => {
    if (!dragging) return;
    setDragging(false);
    const width = trackRef.current?.clientWidth ?? 320;
    if (Math.abs(dragX) > width * 0.18) {
      if (dragX < 0) next();
      else prev();
    }
    setDragX(0);
    axisLocked.current = null;
  };

  const current = cards[index];
  const showDiscard = typeof discardsLeft === "number" && !!onDiscard;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Elegir carta de tu mano"
    >
      {/* Barra superior: contador y cerrar */}
      <div className="flex items-center justify-between px-4 pt-4 sm:px-6">
        <span className="rounded-full border border-border bg-card/60 px-3 py-1 font-display text-sm tracking-widest text-muted-foreground">
          {index + 1} / {cards.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="surface-panel flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-secondary"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {header && <div className="px-4 pt-3 sm:px-6">{header}</div>}

      {/* Carta protagonista */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-14 sm:px-24">
        <div
          ref={trackRef}
          className="h-full max-h-full w-full max-w-sm touch-pan-y select-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className={cn(
              "flex h-full items-center",
              !dragging && "transition-transform duration-300 ease-out",
            )}
            style={{
              transform: `translateX(calc(${-index * 100}% + ${dragX}px))`,
            }}
          >
            {cards.map((c, i) => (
              <div key={c.id} className="flex h-full w-full shrink-0 items-center justify-center p-1">
                <div
                  className={cn(
                    "card-tile relative max-h-full overflow-hidden",
                    i === index ? "card-tile-active ring-2 ring-primary" : "opacity-70",
                  )}
                  style={{
                    // La carta llena la pantalla sin salirse ni del ancho ni del alto disponible
                    width: "min(100%, calc((100dvh - 16rem) * 2 / 3))",
                    aspectRatio: "2 / 3",
                  }}
                >
                  <SignedImage
                    path={c.image_path}
                    alt={`Carta ${i + 1} de tu mano`}
                    className="h-full w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flechas */}
        <button
          type="button"
          onClick={prev}
          disabled={index === 0}
          aria-label="Carta anterior"
          className="surface-panel absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full transition hover:bg-secondary disabled:opacity-30 sm:left-4 sm:h-12 sm:w-12"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={next}
          disabled={index === cards.length - 1}
          aria-label="Carta siguiente"
          className="surface-panel absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full transition hover:bg-secondary disabled:opacity-30 sm:right-4 sm:h-12 sm:w-12"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Puntos */}
      <div className="mt-2 flex justify-center gap-1.5">
        {cards.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Ir a la carta ${i + 1}`}
            className={cn(
              "h-2 rounded-full transition-all",
              i === index ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
            )}
          />
        ))}
      </div>

      {/* Confirmación */}
      <div className="px-4 pb-6 pt-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
          {children}
          {confirmLabel && onConfirm && current && (
            <Button
              onClick={() => void onConfirm(current)}
              disabled={busy || confirmDisabled}
              className="w-full rounded-full py-6 text-base font-semibold"
            >
              <Check className="mr-2 h-5 w-5" />
              {confirmLabel}
            </Button>
          )}
          {showDiscard && current && (
            <div className="flex flex-col gap-2">
              {confirmDiscard ? (
                <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3">
                  <p className="text-center text-sm">
                    ¿Descartar esta carta? Recibirás otra al azar.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setConfirmDiscard(false)}
                      disabled={busy}
                      className="flex-1 rounded-full"
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        await onDiscard?.(current);
                        setConfirmDiscard(false);
                      }}
                      disabled={busy}
                      className="flex-1 rounded-full"
                    >
                      Sí, descartar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setConfirmDiscard(true)}
                  disabled={busy || discardsLeft === 0}
                  className="w-full rounded-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Descartar · {discardsLeft}/{maxDiscards}
                </Button>
              )}
            </div>
          )}
          {!confirmLabel && (
            <p className="text-center text-xs text-muted-foreground">
              Desliza o usa las flechas para revisar tus cartas.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
