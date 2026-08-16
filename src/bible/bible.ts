// Chargement et consultation du texte biblique. Le texte est une table à part
// (§11) : changer de version ne touche ni la nomenclature ni les alias.

import type { Item, Slide, VerseSource } from "../types.ts";
import { booksById, type BookInfo } from "./books.ts";
import { formatReference, type ParsedReference } from "./reference.ts";

export interface BibleVersion {
  id: string;
  name: string;
  abbrev: string;
}

/** Uniquement des versions du domaine public — voir §13. */
export const versions: BibleVersion[] = [
  { id: "lsg", name: "Louis Segond 1910", abbrev: "LSG" },
  { id: "darby", name: "Darby", abbrev: "DBY" },
];

export interface BibleData {
  id: string;
  name: string;
  abbrev: string;
  /** osisID → chapitres → versets. Index 0 = chapitre 1 / verset 1. */
  books: Record<string, string[][]>;
}

export type LookupResult =
  | { ok: true; item: Item }
  | { ok: false; message: string };

export function lookup(
  data: BibleData,
  ref: ParsedReference,
  version: BibleVersion,
): LookupResult {
  const chapters = data.books[ref.book.id];
  if (!chapters) {
    return { ok: false, message: `${ref.book.name} absent de ${version.abbrev}.` };
  }

  const name = ref.book.refName ?? ref.book.name;

  const chapter = chapters[ref.chapter - 1];
  if (!chapter) {
    return {
      ok: false,
      message: `${name} ${ref.chapter} n'existe pas — ${chapters.length} chapitres.`,
    };
  }

  const first = ref.verseStart ?? 1;
  const last = ref.verseStart === undefined ? chapter.length : (ref.verseEnd ?? first);

  if (first > chapter.length) {
    return {
      ok: false,
      message: `${name} ${ref.chapter} n'a que ${chapter.length} versets.`,
    };
  }

  const slides: Slide[] = [];
  for (let n = first; n <= Math.min(last, chapter.length); n += 1) {
    slides.push({
      kind: "verset",
      reference: `${name} ${ref.chapter}.${n} · ${version.abbrev}`,
      body: chapter[n - 1],
      source: {
        versionId: version.id,
        bookId: ref.book.id,
        chapter: ref.chapter,
        verse: n,
      },
    });
  }

  return {
    ok: true,
    item: {
      id: `${version.id}-${ref.book.id}-${ref.chapter}-${first}-${last}-${Date.now()}`,
      kind: "verset",
      label: `${formatReference(ref)} · ${version.abbrev}`,
      slides,
    },
  };
}

/**
 * Verset voisin, en franchissant les chapitres. S'arrête à la fin du livre :
 * enchaîner Malachie sur Matthieu surprendrait plus que ça n'aiderait.
 */
export function neighbourVerse(
  data: BibleData,
  from: VerseSource,
  delta: 1 | -1,
): VerseSource | null {
  const chapters = data.books[from.bookId];
  if (!chapters) return null;

  const verse = from.verse + delta;
  const chapter = chapters[from.chapter - 1];
  if (!chapter) return null;

  if (verse >= 1 && verse <= chapter.length) {
    return { ...from, verse };
  }

  const chapterNumber = from.chapter + delta;
  const neighbour = chapters[chapterNumber - 1];
  if (!neighbour || neighbour.length === 0) return null;

  return {
    ...from,
    chapter: chapterNumber,
    verse: delta === 1 ? 1 : neighbour.length,
  };
}

/** Diapositive correspondant à une position, ou null si elle n'existe pas. */
export function slideFromSource(
  data: BibleData,
  source: VerseSource,
  version: BibleVersion,
): Slide | null {
  const body = data.books[source.bookId]?.[source.chapter - 1]?.[source.verse - 1];
  if (body === undefined) return null;

  const book = booksById.get(source.bookId);
  const name = book ? (book.refName ?? book.name) : source.bookId;

  return {
    kind: "verset",
    reference: `${name} ${source.chapter}.${source.verse} · ${version.abbrev}`,
    body,
    source,
  };
}

/** « 16, 17, 18, 20 » → « 16-18, 20 ». Une sélection éparse reste lisible. */
export function formatVerseList(verses: number[]): string {
  const sorted = [...new Set(verses)].sort((a, b) => a - b);
  const parts: string[] = [];
  let runStart = 0;

  for (let i = 0; i < sorted.length; i += 1) {
    const isLast = i === sorted.length - 1;
    if (isLast || sorted[i + 1] !== sorted[i] + 1) {
      const from = sorted[runStart];
      const to = sorted[i];
      // Deux versets qui se suivent se lisent mieux séparés qu'en plage.
      parts.push(
        to - from >= 2 ? `${from}-${to}` : to > from ? `${from}, ${to}` : `${from}`,
      );
      runStart = i + 1;
    }
  }
  return parts.join(", ");
}

/**
 * Étiquette de déroulé recalculée depuis les diapositives, pour qu'un passage
 * qu'on prolonge à la flèche annonce ce qu'il contient réellement.
 * Renvoie `fallback` dès qu'une diapositive n'est pas un verset (cantique).
 */
export function labelForSlides(slides: Slide[], fallback: string): string {
  const sources = slides.map((s) => s.source);
  if (sources.length === 0 || sources.some((s) => s === undefined)) return fallback;

  const known = sources as VerseSource[];
  const first = known[0];
  const last = known[known.length - 1];
  if (known.some((s) => s.bookId !== first.bookId)) return fallback;

  const book = booksById.get(first.bookId);
  const name = book ? (book.refName ?? book.name) : first.bookId;
  const abbrev =
    versions.find((v) => v.id === first.versionId)?.abbrev ?? first.versionId;

  // Dans un même chapitre, la liste repliée reste exacte même si la sélection
  // saute des versets ; à cheval sur deux chapitres, on borne le passage.
  const body = known.every((s) => s.chapter === first.chapter)
    ? `${name} ${first.chapter}.${formatVerseList(known.map((s) => s.verse))}`
    : `${name} ${first.chapter}.${first.verse} - ${last.chapter}.${last.verse}`;

  return `${body} · ${abbrev}`;
}

/** Une diapositive par verset, ou tous les versets réunis sur une seule. */
export type GroupMode = "separate" | "grouped";

let selectionCount = 0;

/**
 * Construit un passage à partir de versets choisis à la main, éventuellement
 * non contigus — ce que le parseur de référence ne sait pas exprimer.
 */
export function buildSelection(
  data: BibleData,
  book: BookInfo,
  chapterNumber: number,
  verses: number[],
  version: BibleVersion,
  mode: GroupMode,
): Item | null {
  const chapter = data.books[book.id]?.[chapterNumber - 1];
  if (!chapter) return null;

  const chosen = [...new Set(verses)]
    .sort((a, b) => a - b)
    .filter((n) => n >= 1 && n <= chapter.length);
  if (chosen.length === 0) return null;

  const name = book.refName ?? book.name;
  const summary = `${name} ${chapterNumber}.${formatVerseList(chosen)}`;

  selectionCount += 1;
  const slides: Slide[] =
    mode === "grouped"
      ? [
          {
            kind: "verset",
            reference: `${summary} · ${version.abbrev}`,
            body: chosen.map((n) => chapter[n - 1]).join(" "),
          },
        ]
      : chosen.map((n) => ({
          kind: "verset" as const,
          reference: `${name} ${chapterNumber}.${n} · ${version.abbrev}`,
          body: chapter[n - 1],
          source: {
            versionId: version.id,
            bookId: book.id,
            chapter: chapterNumber,
            verse: n,
          },
        }));

  return {
    id: `${version.id}-${book.id}-${chapterNumber}-sel-${selectionCount}`,
    kind: "verset",
    label: `${summary} · ${version.abbrev}`,
    slides,
  };
}
