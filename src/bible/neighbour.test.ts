import assert from "node:assert/strict";
import { test } from "node:test";
import { neighbourVerse, slideFromSource, type BibleData } from "./bible.ts";

// Jean : ch.1 = 3 versets, ch.2 = 2 versets. Marc : un seul chapitre.
const data: BibleData = {
  id: "test",
  name: "Test",
  abbrev: "TST",
  books: {
    John: [["1.1", "1.2", "1.3"], ["2.1", "2.2"]],
    Mark: [["m1"]],
  },
};
const version = { id: "test", name: "Test", abbrev: "TST" };
const at = (chapter: number, verse: number) => ({
  versionId: "test",
  bookId: "John",
  chapter,
  verse,
});

function step(chapter: number, verse: number, delta: 1 | -1) {
  const n = neighbourVerse(data, at(chapter, verse), delta);
  return n ? `${n.chapter}.${n.verse}` : null;
}

test("avance dans le chapitre", () => {
  assert.equal(step(1, 1, 1), "1.2");
  assert.equal(step(1, 2, 1), "1.3");
});

test("recule dans le chapitre", () => {
  assert.equal(step(1, 3, -1), "1.2");
});

test("franchit la fin du chapitre vers le premier verset du suivant", () => {
  assert.equal(step(1, 3, 1), "2.1");
});

test("franchit le début du chapitre vers le dernier verset du précédent", () => {
  assert.equal(step(2, 1, -1), "1.3");
});

test("s'arrête aux bornes du livre", () => {
  assert.equal(step(2, 2, 1), null);
  assert.equal(step(1, 1, -1), null);
});

test("livre inconnu ou chapitre hors bornes : null", () => {
  assert.equal(
    neighbourVerse(data, { versionId: "test", bookId: "Zzz", chapter: 1, verse: 1 }, 1),
    null,
  );
  assert.equal(step(9, 1, 1), null);
});

test("slideFromSource produit la référence française", () => {
  const slide = slideFromSource(data, at(1, 2), version)!;
  assert.equal(slide.reference, "Jean 1.2 · TST");
  assert.equal(slide.body, "1.2");
  assert.deepEqual(slide.source, at(1, 2));
});

test("slideFromSource renvoie null hors du texte", () => {
  assert.equal(slideFromSource(data, at(1, 99), version), null);
});

test("un livre d'un seul chapitre n'ouvre sur rien", () => {
  const mark = { versionId: "test", bookId: "Mark", chapter: 1, verse: 1 } as const;
  assert.equal(neighbourVerse(data, mark, 1), null);
  assert.equal(neighbourVerse(data, mark, -1), null);
});
