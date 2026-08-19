/**
 * Réglages de la sortie en salle, distincts de l'apparence de l'incrustation
 * OBS (voir appearance.ts). Le fond d'image ne concerne que le
 * vidéoprojecteur : l'overlay doit rester transparent (§7), sans quoi
 * l'incrustation masquerait la caméra.
 */

export interface ProjectionBackground {
  /** Identifiant d'une image importée, ou null pour un fond noir. */
  imageId: string | null;
  /** Opacité de l'image, 0 à 1. Le texte reste toujours à pleine opacité. */
  opacity: number;
  /** Agrandissement, 1 = l'image couvre l'écran. */
  scale: number;
}

export interface Ticker {
  enabled: boolean;
  text: string;
  /** Durée d'un passage complet, en secondes. */
  durationSec: number;
}

export const defaultBackground: ProjectionBackground = {
  imageId: null,
  opacity: 0.45,
  scale: 1,
};

export const defaultTicker: Ticker = {
  enabled: false,
  text: "",
  durationSec: 30,
};

export const OPACITY_MIN = 0;
export const OPACITY_MAX = 1;
export const SCALE_MIN = 1;
export const SCALE_MAX = 2.5;
export const DURATION_MIN = 8;
export const DURATION_MAX = 120;
/** Au-delà, le bandeau devient illisible et le rendu coûte cher. */
export const TICKER_MAX_LENGTH = 500;

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function normalizeBackground(raw: unknown): ProjectionBackground {
  const value = (raw ?? {}) as Partial<ProjectionBackground>;
  return {
    imageId: typeof value.imageId === "string" ? value.imageId : null,
    opacity: clamp(value.opacity, OPACITY_MIN, OPACITY_MAX, defaultBackground.opacity),
    scale: clamp(value.scale, SCALE_MIN, SCALE_MAX, defaultBackground.scale),
  };
}

export function normalizeTicker(raw: unknown): Ticker {
  const value = (raw ?? {}) as Partial<Ticker>;
  const text = typeof value.text === "string" ? value.text.slice(0, TICKER_MAX_LENGTH) : "";
  return {
    // Un bandeau sans texte n'aurait rien à faire défiler : on le tient pour éteint.
    enabled: value.enabled === true && text.trim() !== "",
    text,
    durationSec: clamp(
      value.durationSec,
      DURATION_MIN,
      DURATION_MAX,
      defaultTicker.durationSec,
    ),
  };
}

/** Variables CSS de la sortie en salle. */
export function projectionVars(
  background: ProjectionBackground,
  ticker: Ticker,
): Record<string, string> {
  return {
    "--fond-opacite": String(background.opacity),
    "--fond-echelle": String(background.scale),
    "--bandeau-duree": `${ticker.durationSec}s`,
  };
}
