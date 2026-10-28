import type { Item, Slide } from "../types";

/**
 * Persistance du déroulé le temps d'une session de régie.
 *
 * `sessionStorage` porte exactement la sémantique voulue : le contenu survit
 * à un rechargement — le cas qui fait peur en plein culte, quand la console
 * est actualisée par accident — et disparaît à la fermeture de l'onglet.
 * Chaque ouverture de la régie repart donc d'un déroulé vide, sans quoi le
 * culte précédent resterait à l'écran la semaine suivante.
 *
 * Les réglages d'apparence, eux, restent dans localStorage : ce sont des
 * préférences, pas des données de culte.
 */
const KEY = "projecteur.session";

export interface ConsoleSession {
  items: Item[];
  slide: Slide | null;
  salleVisible: boolean;
  incrustationVisible: boolean;
  itemIndex: number;
  slideIndex: number;
  /** Instant du premier passage à l'antenne, ou null si rien n'a été projeté. */
  debutCulte: number | null;
}

export function loadSession(): ConsoleSession | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<ConsoleSession> & { visible?: boolean };
    if (!Array.isArray(value.items)) return null;
    // `visible` est le champ unique d'avant la séparation : une session
    // rechargée en plein culte doit retrouver ses sorties allumées.
    const ancien = value.visible === true;
    return {
      items: value.items,
      slide: value.slide ?? null,
      salleVisible: value.salleVisible ?? ancien,
      incrustationVisible: value.incrustationVisible ?? ancien,
      itemIndex: typeof value.itemIndex === "number" ? value.itemIndex : 0,
      slideIndex: typeof value.slideIndex === "number" ? value.slideIndex : 0,
      debutCulte: typeof value.debutCulte === "number" ? value.debutCulte : null,
    };
  } catch {
    // Session illisible : repartir à vide vaut mieux que planter la régie.
    return null;
  }
}

export function saveSession(session: ConsoleSession): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Quota dépassé ou stockage refusé : la régie continue de fonctionner,
    // seule la reprise après rechargement est perdue.
  }
}
