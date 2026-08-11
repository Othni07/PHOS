// Parseur de référence (§11). C'est le geste le plus fréquent de tout le
// logiciel : taper « jn 3:16 » ou « Ps 23 » doit aboutir sans réfléchir.
// Insensible aux accents et à la casse, tolérant sur les séparateurs.

import { aliasIndex, books, normalize, type BookInfo } from "./books.ts";

export interface ParsedReference {
  book: BookInfo;
  chapter: number;
  /** Absent = chapitre entier. */
  verseStart?: number;
  /** Absent = un seul verset. */
  verseEnd?: number;
}

// Queue numérique : chapitre, puis éventuellement verset et plage.
// Séparateurs acceptés : « : » « . » « , » ou une simple espace.
const TAIL = /(\d+)\s*(?:[:.,\s]\s*(\d+)(?:\s*[-–—]\s*(\d+))?)?\s*$/;

/** Livres dont un alias commence par la saisie — pour la frappe progressive. */
export function suggestBooks(input: string, limit = 8): BookInfo[] {
  const key = normalize(input);
  if (!key) return [];
  const found: BookInfo[] = [];
  for (const book of books) {
    const candidates = [book.name, book.abbrev, book.id, ...book.extras];
    if (candidates.some((c) => normalize(c).startsWith(key))) {
      found.push(book);
      if (found.length >= limit) break;
    }
  }
  return found;
}

function resolveBook(rawBookPart: string): BookInfo | null {
  const key = normalize(rawBookPart);
  if (!key) return null;

  const exact = aliasIndex.get(key);
  if (exact) return exact;

  // Frappe partielle : on n'accepte que si un seul livre correspond, pour ne
  // jamais projeter un texte que l'opérateur n'a pas explicitement demandé.
  const matches = suggestBooks(key, 2);
  return matches.length === 1 ? matches[0] : null;
}

export function parseReference(input: string): ParsedReference | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const tail = TAIL.exec(trimmed);

  // Sans queue numérique, toute la saisie est un nom de livre : « jean ».
  if (!tail) {
    const book = resolveBook(trimmed);
    return book ? { book, chapter: 1 } : null;
  }

  const book = resolveBook(trimmed.slice(0, tail.index));
  if (!book) return null;

  const chapter = Number(tail[1]);
  const verseStart = tail[2] ? Number(tail[2]) : undefined;
  const verseEnd = tail[3] ? Number(tail[3]) : undefined;

  if (chapter < 1) return null;
  if (verseStart !== undefined && verseStart < 1) return null;
  // Une plage inversée (« 16-12 ») est une faute de frappe, pas une intention.
  if (verseEnd !== undefined && verseStart !== undefined && verseEnd < verseStart) {
    return { book, chapter, verseStart };
  }

  return { book, chapter, verseStart, verseEnd };
}

/** « Jean 3.16 », « Jean 3.16-18 », « Psaume 23 » — convention française. */
export function formatReference(ref: ParsedReference): string {
  const name = ref.book.refName ?? ref.book.name;
  if (ref.verseStart === undefined) return `${name} ${ref.chapter}`;
  if (ref.verseEnd === undefined) return `${name} ${ref.chapter}.${ref.verseStart}`;
  return `${name} ${ref.chapter}.${ref.verseStart}-${ref.verseEnd}`;
}
