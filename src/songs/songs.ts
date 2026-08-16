// Chargement du recueil. Même schéma que bible.ts : le fichier passe par la
// couche plateforme, jamais par un fetch direct (§5).

import { platform } from "../platform";
import type { SongBook } from "./types";

/** Recueil chargé au démarrage. Un seul pour l'instant — le MVP reste simple. */
export const DEFAULT_SONGBOOK = "cantiques.json";

const cache = new Map<string, Promise<SongBook>>();

export function loadSongBook(file = DEFAULT_SONGBOOK): Promise<SongBook> {
  let pending = cache.get(file);
  if (!pending) {
    pending = platform.loadData<SongBook>(file);
    // Un échec ne doit pas empoisonner le cache : une seconde tentative doit
    // pouvoir réussir.
    pending.catch(() => cache.delete(file));
    cache.set(file, pending);
  }
  return pending;
}
