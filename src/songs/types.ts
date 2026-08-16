// Modèle cantique (§11). Le point important : des parties structurées, jamais
// un bloc de texte. C'est ce qui permet de projeter strophe par strophe, de
// réordonner à la volée, et plus tard d'importer OpenLP ou VideoPsalm.

export type SongPartKind = "strophe" | "refrain" | "pont" | "final";

export interface SongPart {
  kind: SongPartKind;
  /** Rang de la partie parmi celles de même nature. Absent si unique. */
  number?: number;
  /** Texte projeté, \n conservés. */
  body: string;
}

export interface Song {
  id: string;
  /** Numéro dans le recueil — le moyen de recherche le plus rapide en régie. */
  number?: number;
  title: string;
  author?: string;
  /** Tonalité usuelle, pour les musiciens. Jamais projetée. */
  key?: string;
  ccli?: string;
  /**
   * Ordre de chant explicite, en jetons : « s1 », « r », « r2 », « p », « f ».
   * Absent = ordre déduit (§ resolveOrder) : chaque strophe suivie du refrain.
   */
  order?: string[];
  parts: SongPart[];
}

export interface SongBook {
  id: string;
  name: string;
  /** Provenance et état de relecture des paroles. */
  note?: string;
  songs: Song[];
}
