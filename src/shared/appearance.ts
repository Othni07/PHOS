/**
 * Apparence de l'incrustation OBS, réglable depuis la régie.
 *
 * Le besoin vient du direct : sur une image claire, un bandeau trop discret
 * laisse du texte blanc sur fond blanc, donc illisible pour les spectateurs
 * en ligne. Ces réglages doivent pouvoir être corrigés pendant le culte, pas
 * dans le code.
 */
export interface OverlayAppearance {
  /** Clé d'une entrée de `fontChoices`. */
  fontId: string;
  /** Multiplicateur appliqué à la taille de base. */
  fontScale: number;
  /** Opacité du fond derrière le texte, 0 à 1. */
  bandOpacity: number;
  /** Durée des fondus, en millisecondes. */
  transitionMs: number;
}

export interface FontChoice {
  id: string;
  label: string;
  stack: string;
}

/**
 * Polices système uniquement (§7) : l'application doit démarrer hors ligne et
 * ne déclencher aucune requête réseau au chargement.
 */
export const fontChoices: FontChoice[] = [
  {
    id: "system",
    label: "Système",
    stack: '-apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  { id: "segoe", label: "Segoe UI", stack: '"Segoe UI", Tahoma, sans-serif' },
  { id: "arial", label: "Arial", stack: "Arial, Helvetica, sans-serif" },
  { id: "verdana", label: "Verdana", stack: "Verdana, Geneva, sans-serif" },
  { id: "tahoma", label: "Tahoma", stack: "Tahoma, Verdana, sans-serif" },
  { id: "trebuchet", label: "Trebuchet MS", stack: '"Trebuchet MS", Tahoma, sans-serif' },
  { id: "georgia", label: "Georgia", stack: 'Georgia, "Times New Roman", serif' },
  { id: "times", label: "Times New Roman", stack: '"Times New Roman", Times, serif' },
];

export const defaultAppearance: OverlayAppearance = {
  fontId: "system",
  fontScale: 1,
  bandOpacity: 1,
  transitionMs: 450,
};

export const FONT_SCALE_MIN = 0.6;
export const FONT_SCALE_MAX = 2.2;
export const TRANSITION_MIN = 0;
export const TRANSITION_MAX = 1500;

function clamp(value: number, min: number, max: number, fallback: number): number {
  // Une valeur illisible (état persisté d'une version antérieure, message
  // tronqué) ne doit jamais vider l'écran : on retombe sur le défaut.
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

/** Rend exploitable une apparence venue du stockage ou du réseau. */
export function normalizeAppearance(raw: unknown): OverlayAppearance {
  const value = (raw ?? {}) as Partial<OverlayAppearance>;
  const known = fontChoices.some((f) => f.id === value.fontId);
  return {
    fontId: known ? (value.fontId as string) : defaultAppearance.fontId,
    fontScale: clamp(
      value.fontScale as number,
      FONT_SCALE_MIN,
      FONT_SCALE_MAX,
      defaultAppearance.fontScale,
    ),
    bandOpacity: clamp(value.bandOpacity as number, 0, 1, defaultAppearance.bandOpacity),
    transitionMs: clamp(
      value.transitionMs as number,
      TRANSITION_MIN,
      TRANSITION_MAX,
      defaultAppearance.transitionMs,
    ),
  };
}

export function fontStack(fontId: string): string {
  return (
    fontChoices.find((f) => f.id === fontId)?.stack ??
    fontChoices[0].stack
  );
}

/** Variables CSS consommées par l'overlay et par son aperçu dans la régie. */
export function appearanceVars(
  appearance: OverlayAppearance,
): Record<string, string> {
  return {
    "--overlay-font": fontStack(appearance.fontId),
    "--overlay-scale": String(appearance.fontScale),
    "--overlay-band-opacity": String(appearance.bandOpacity),
    "--overlay-transition": `${appearance.transitionMs}ms`,
  };
}
