/** Dominio público de la partida: el enlace que se puede compartir con cualquiera. */
export const PUBLIC_SITE_URL = "https://gallery-game-creator.lovable.app";

/**
 * Origen apto para invitar. En el preview del editor (id-preview--…lovable.app)
 * o dentro de lovable.dev el enlace exigiría cuenta de Lovable, así que
 * devolvemos el dominio publicado.
 */
export function shareOrigin(): string {
  if (typeof window === "undefined") return PUBLIC_SITE_URL;
  const host = window.location.hostname;
  const isPrivatePreview =
    host.includes("id-preview--") ||
    host.endsWith("lovable.dev") ||
    host.endsWith("lovableproject.com") ||
    host === "localhost" ||
    host === "127.0.0.1";
  return isPrivatePreview ? PUBLIC_SITE_URL : window.location.origin;
}

/** Enlace de invitación a una sala. */
export function roomInviteUrl(code: string): string {
  return `${shareOrigin()}/sala/${code.toUpperCase()}`;
}
