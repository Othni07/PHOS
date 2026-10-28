// Chargement du recueil. Même schéma que bible.ts : le fichier passe par la
// couche plateforme, jamais par un fetch direct (§5).

import { platform } from "../platform";
import { mergeSongBook } from "./listing.ts";
import type { SongBook } from "./types";

/** Recueil livré avec le code : les 146 cantiques du CMR. */
export const DEFAULT_SONGBOOK = "cantiques.json";

/**
 * Second recueil, alimenté par l'opérateur à partir de ses exports.
 *
 * En phase 1 l'application n'écrit pas sur le disque : ce fichier se dépose à
 * la main, une fois, et les chants qu'il contient cessent d'être prisonniers
 * du stockage d'un seul navigateur. Il est absent d'une installation neuve, et
 * écarté du dépôt public — les 146 cantiques du CMR sont diffusables parce que
 * le responsable l'a autorisé, ce qui ne vaut pas pour un chant trouvé
 * ailleurs. Même garde-fou que les versions bibliques sous droits.
 */
export const AJOUTS_SONGBOOK = "cantiques-ajouts.json";

const cache = new Map<string, Promise<SongBook>>();

function charger(file: string): Promise<SongBook> {
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

/**
 * Le recueil livré, complété des ajouts locaux s'il y en a. Les ajouts passent
 * devant : un chant repris sous l'identifiant d'un cantique livré en corrige
 * les paroles, exactement comme le fait la saisie en régie.
 */
export async function loadSongBook(): Promise<SongBook> {
  const livre = await charger(DEFAULT_SONGBOOK);
  if (!(await platform.hasData(AJOUTS_SONGBOOK))) return livre;

  try {
    const ajouts = await charger(AJOUTS_SONGBOOK);
    const chants = Array.isArray(ajouts.songs) ? ajouts.songs : [];
    if (chants.length === 0) return livre;
    return { ...mergeSongBook(livre, chants), name: livre.name };
  } catch {
    // Fichier illisible ou mal formé : le recueil livré vaut mieux que rien.
    // La régie doit démarrer un dimanche matin même si le fichier déposé la
    // veille était abîmé.
    return livre;
  }
}
