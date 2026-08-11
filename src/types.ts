export type SlideKind = "verset" | "cantique";

export interface Slide {
  kind: SlideKind;
  reference: string; // « Jean 3.16 · LSG » ou « Strophe 2 »
  body: string; // texte projeté, \n conservés
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
