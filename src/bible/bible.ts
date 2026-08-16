// Chargement et consultation du texte biblique. Le texte est une table à part
// (§11) : changer de version ne touche ni la nomenclature ni les alias.

import type { Item, Slide } from "../types.ts";
import type { BookInfo } from "./books.ts";
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
        }));

  return {
    id: `${version.id}-${book.id}-${chapterNumber}-sel-${selectionCount}`,
    kind: "verset",
    label: `${summary} · ${version.abbrev}`,
    slides,
  };
}
