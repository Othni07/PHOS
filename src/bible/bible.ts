// Chargement et consultation du texte biblique. Le texte est une table à part
// (§11) : changer de version ne touche ni la nomenclature ni les alias.

import { platform } from "../platform";
import type { Item, Slide } from "../types";
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

interface BibleData {
  id: string;
  name: string;
  abbrev: string;
  /** osisID → chapitres → versets. Index 0 = chapitre 1 / verset 1. */
  books: Record<string, string[][]>;
}

const cache = new Map<string, Promise<BibleData>>();

export function loadBible(versionId: string): Promise<BibleData> {
  let pending = cache.get(versionId);
  if (!pending) {
    pending = platform.loadData<BibleData>(`bible-${versionId}.json`);
    // Un échec ne doit pas empoisonner le cache : une seconde tentative
    // (réseau revenu, fichier déposé) doit pouvoir réussir.
    pending.catch(() => cache.delete(versionId));
    cache.set(versionId, pending);
  }
  return pending;
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
