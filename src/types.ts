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
}
