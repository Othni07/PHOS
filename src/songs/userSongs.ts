// Cantiques saisis depuis la régie, par opposition à ceux livrés dans
// public/data/cantiques.json.
//
// En phase 1 l'application n'a pas accès au disque (§2) : ils vivent donc dans
// le stockage du navigateur, via la couche plateforme. Ils survivent aux
// redémarrages mais restent attachés à cette machine — d'où l'export, qui est
// la seule sauvegarde possible aujourd'hui et la reprise prévue pour la
// phase 2 sous SQLite.

import { platform } from "../platform";
import { withExplicitOrder } from "./search.ts";
import type { Song, SongBook } from "./types";

const KEY = "songs.user";

export async function loadUserSongs(): Promise<Song[]> {
  const stored = await platform.store.get<Song[]>(KEY);
  if (!Array.isArray(stored)) return [];
  // Un cantique saisi avant l'ordre explicite resterait soumis à la convention
  // « strophe puis refrain » : son ordre est inscrit au chargement, pour que la
  // suite montrée par l'éditeur soit exactement celle qui sera projetée. Une
  // entrée abîmée est laissée telle quelle plutôt que de faire échouer tout le
  // chargement.
  return stored.map((song) =>
    song?.order === undefined && Array.isArray(song?.parts)
      ? withExplicitOrder(song)
      : song,
  );
}

export async function saveUserSongs(songs: Song[]): Promise<void> {
  await platform.store.set(KEY, songs);
}

/**
 * Recueil unique pour la recherche. Les cantiques saisis passent devant : si
 * l'opérateur a ressaisi un cantique du recueil d'amorce pour en corriger les
 * paroles, c'est sa version qui doit sortir.
 */
export function mergeSongBook(bundled: SongBook | null, user: Song[]): SongBook {
  const base = bundled?.songs ?? [];
  const overridden = new Set(user.map((s) => s.id));
  return {
    id: "regie",
    name: bundled?.name ?? "Cantiques",
    songs: [...user, ...base.filter((s) => !overridden.has(s.id))],
  };
}

/** Identifiant stable tiré du titre, suffixé pour rester unique. */
export function songId(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${slug || "cantique"}-${Date.now().toString(36)}`;
}
