import type { OverlayAppearance } from "./shared/appearance.ts";
import type { ProjectionBackground, Ticker } from "./shared/settings.ts";

export type SlideKind = "verset" | "cantique";

/**
 * Position d'un verset dans le texte, conservée sur la diapositive pour que la
 * lecture puisse se poursuivre au-delà du passage choisi : projeter Jean 1.1
 * puis continuer à la flèche suppose de savoir où l'on se trouve.
 */
export interface VerseSource {
  versionId: string;
  bookId: string;
  chapter: number;
  verse: number;
}

export interface Slide {
  kind: SlideKind;
  reference: string; // « Jean 3.16 · LSG » ou « Strophe 2 »
  body: string; // texte projeté, \n conservés
  source?: VerseSource; // absent pour un cantique
}

export interface Item {
  id: string;
  kind: SlideKind;
  label: string; // titre dans le déroulé, JAMAIS projeté
  slides: Slide[];
}

export interface ShowState {
  slide: Slide | null;
  visible: boolean; // false = écran noir, contenu reste chargé
  itemIndex: number;
  slideIndex: number;
  /**
   * Apparence de l'overlay OBS. Portée par l'état plutôt que par un message
   * séparé : elle emprunte ainsi les mêmes canaux, la même persistance et le
   * même rejeu à la connexion, sans quoi une source OBS recréée en plein
   * culte reviendrait aux réglages d'usine.
   */
  appearance: OverlayAppearance;
  /** Fond de la projection en salle. L'overlay OBS n'en tient jamais compte. */
  background: ProjectionBackground;
  /** Bandeau défilant en bas de la projection. */
  ticker: Ticker;
}
