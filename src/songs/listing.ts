// Composition du recueil : ce qui est livré avec le code et ce qui a été saisi
// en régie, réunis en une seule vue.
//
// Aucune dépendance à la plateforme ni au navigateur — comme search.ts, ce
// module est testable seul. Le stockage, lui, vit dans userSongs.ts.

import type { Song, SongBook } from "./types.ts";

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

/** D'où vient un cantique de la liste présentée en régie. */
export type SongOrigin = "recueil" | "modifie" | "ajoute";

export interface SongListing {
  song: Song;
  origin: SongOrigin;
}

/**
 * Liste unifiée pour l'éditeur : le recueil livré et les cantiques saisis,
 * chacun étiqueté par sa provenance.
 *
 * Un cantique saisi qui reprend l'identifiant d'un cantique du recueil le
 * remplace — c'est le mécanisme de correction des paroles décrit par
 * `mergeSongBook`. L'étiquette « modifié » le rend visible, sans quoi
 * l'opérateur n'aurait aucun moyen de savoir ce qu'il a déjà retouché, ni de
 * revenir à l'original.
 *
 * Tri par numéro puis par titre : c'est l'ordre d'un recueil papier, le seul
 * dans lequel on retrouve un chant qu'on cherche des yeux.
 */
export function listSongs(bundled: SongBook | null, user: Song[]): SongListing[] {
  const duRecueil = bundled?.songs ?? [];
  const connus = new Set(duRecueil.map((s) => s.id));
  const remplacements = new Map(user.map((s) => [s.id, s]));

  const liste: SongListing[] = duRecueil.map((song) => {
    const remplace = remplacements.get(song.id);
    return remplace
      ? { song: remplace, origin: "modifie" as const }
      : { song, origin: "recueil" as const };
  });

  for (const song of user) {
    if (!connus.has(song.id)) liste.push({ song, origin: "ajoute" });
  }

  return liste.sort(
    (a, b) =>
      (a.song.number ?? Infinity) - (b.song.number ?? Infinity) ||
      a.song.title.localeCompare(b.song.title, "fr"),
  );
}

/**
 * Empreinte du contenu saisi, pour savoir s'il a changé depuis le dernier
 * export. Un simple décompte raterait une correction de paroles, qui est
 * précisément le travail qu'on ne veut pas perdre.
 *
 * L'ordre des clés produit par JSON.stringify suit l'ordre d'insertion : deux
 * objets équivalents pourraient donner deux empreintes. L'erreur penche du bon
 * côté — on annonce « non exporté » à tort, jamais « à jour » à tort.
 */
export function empreinteCantiques(songs: Song[]): string {
  const texte = JSON.stringify(songs);
  let h = 5381;
  for (let i = 0; i < texte.length; i += 1) {
    h = ((h * 33) ^ texte.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}
