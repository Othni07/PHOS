// Recherche de cantiques et mise en diapositives. Aucune dépendance à la
// plateforme ni au navigateur : ce module est testable seul, comme
// bible/reference.ts.

import { normalize } from "../bible/books.ts";
import type { Item, Slide } from "../types.ts";
import type { Song, SongBook, SongPart } from "./types.ts";

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
