// Recherche de cantiques et mise en diapositives. Aucune dépendance à la
// plateforme ni au navigateur : ce module est testable seul, comme
// bible/reference.ts.

import { normalize } from "../bible/books.ts";
import type { Item, Slide } from "../types.ts";
import type { Song, SongBook, SongPart, SongPartKind } from "./types.ts";

/** Jeton d'ordre d'une partie : « s1 », « r », « r2 », « p », « f ». */
export function partToken(part: SongPart): string {
  const letter = { strophe: "s", refrain: "r", pont: "p", final: "f" }[part.kind];
  return part.number === undefined ? letter : `${letter}${part.number}`;
}

/** Étiquette affichée sous la diapositive. Le titre n'est jamais projeté (§6). */
export function partLabel(part: SongPart): string {
  const name = { strophe: "Strophe", refrain: "Refrain", pont: "Pont", final: "Final" }[
    part.kind
  ];
  return part.number === undefined ? name : `${name} ${part.number}`;
}

/**
 * Ordre de chant. Si le cantique n'en déclare pas, on applique la convention
 * qui couvre l'écrasante majorité des cas : chaque strophe suivie du refrain,
 * puis les parties restantes. Un cantique qui s'en écarte déclare son `order`.
 */
export function resolveOrder(song: Song): SongPart[] {
  if (song.order) {
    const byToken = new Map(song.parts.map((p) => [partToken(p), p]));
    const parts = song.order.map((token) => byToken.get(token)).filter((p) => p !== undefined);
    // Un `order` qui ne résout rien serait pire que pas d'ordre du tout.
    if (parts.length > 0) return parts;
  }

  const verses = song.parts.filter((p) => p.kind === "strophe");
  const chorus = song.parts.find((p) => p.kind === "refrain");
  const rest = song.parts.filter(
    (p) => p.kind !== "strophe" && p !== chorus,
  );

  if (verses.length === 0) return song.parts;

  const ordered: SongPart[] = [];
  for (const verse of verses) {
    ordered.push(verse);
    if (chorus) ordered.push(chorus);
  }
  return [...ordered, ...rest];
}

/**
 * Renumérote les parties par nature, dans leur ordre d'apparition. Deux raisons.
 *
 * D'abord les étiquettes : supprimer la première strophe de trois laissait
 * « Strophe 2 » et « Strophe 3 », sans première.
 *
 * Ensuite l'unicité des jetons, dont dépend l'ordre explicite. Changer la
 * nature d'une partie ne la renumérotait pas : deux parties pouvaient porter
 * le même jeton, et un ordre qui les désigne n'en aurait retenu qu'une.
 *
 * La convention de l'éditeur est conservée : une strophe porte toujours son
 * rang, les autres natures seulement quand il y en a plusieurs — « Refrain »
 * plutôt que « Refrain 1 ».
 */
export function renumberParts(parts: SongPart[]): SongPart[] {
  const total = new Map<SongPartKind, number>();
  for (const part of parts) total.set(part.kind, (total.get(part.kind) ?? 0) + 1);

  const rank = new Map<SongPartKind, number>();
  return parts.map((part) => {
    const next = (rank.get(part.kind) ?? 0) + 1;
    rank.set(part.kind, next);
    const numbered = part.kind === "strophe" || (total.get(part.kind) ?? 0) > 1;
    const { number: _ancien, ...reste } = part;
    return numbered ? { ...reste, number: next } : reste;
  });
}

/**
 * Inscrit dans le cantique l'ordre de chant que décrit la suite de ses parties.
 *
 * Sans cela, `resolveOrder` applique sa convention — chaque strophe suivie du
 * refrain — et les flèches de réordonnancement de l'éditeur n'ont aucun effet
 * sur ce qui est projeté : l'interface promet un ordre qu'elle ne tient pas.
 *
 * Ne s'applique qu'aux cantiques saisis en régie. Le recueil livré ne déclare
 * pas d'ordre et garde donc la convention, qui lui convient.
 */
export function withExplicitOrder(song: Song): Song {
  const parts = renumberParts(song.parts);
  return { ...song, parts, order: parts.map(partToken) };
}

export function songToItem(song: Song): Item {
  const slides: Slide[] = resolveOrder(song).map((part) => ({
    kind: "cantique",
    reference: partLabel(part),
    body: part.body,
  }));

  return {
    // Horodaté : le même cantique peut être ajouté deux fois au déroulé.
    id: `song-${song.id}-${Date.now()}`,
    kind: "cantique",
    label: song.number === undefined ? song.title : `${song.number} · ${song.title}`,
    slides,
  };
}

export interface SongQuery {
  /** Numéro dans le recueil, quand la saisie est « 42 » ou « #42 ». */
  number?: number;
  /** Fragment de titre normalisé. */
  text?: string;
}

const NUMBER_ONLY = /^#?\s*(\d+)$/;

export function parseSongQuery(input: string): SongQuery | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const asNumber = NUMBER_ONLY.exec(trimmed);
  if (asNumber) {
    const number = Number(asNumber[1]);
    return number > 0 ? { number } : null;
  }

  const text = normalize(trimmed.replace(/^#/, ""));
  return text ? { text } : null;
}

/**
 * Résultats classés : numéro exact d'abord, puis les titres qui commencent par
 * la saisie, puis ceux qui la contiennent. En régie on prend le premier.
 */
export function searchSongs(book: SongBook, input: string, limit = 6): Song[] {
  const query = parseSongQuery(input);
  if (!query) return [];

  if (query.number !== undefined) {
    return book.songs.filter((s) => s.number === query.number).slice(0, limit);
  }

  const key = query.text;
  if (!key) return [];

  const scored: Array<{ song: Song; score: number }> = [];
  for (const song of book.songs) {
    const title = normalize(song.title);
    if (title.startsWith(key)) scored.push({ song, score: 0 });
    else if (title.includes(key)) scored.push({ song, score: 1 });
  }

  scored.sort(
    (a, b) => a.score - b.score || (a.song.number ?? Infinity) - (b.song.number ?? Infinity),
  );
  return scored.slice(0, limit).map((s) => s.song);
}
