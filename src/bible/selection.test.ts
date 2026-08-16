import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSelection, formatVerseList, type BibleData } from "./bible.ts";
import { booksById } from "./books.ts";

test("formatVerseList replie les suites consécutives", () => {
  assert.equal(formatVerseList([16]), "16");
  assert.equal(formatVerseList([16, 17]), "16, 17");
  assert.equal(formatVerseList([16, 17, 18]), "16-18");
  assert.equal(formatVerseList([16, 17, 18, 20]), "16-18, 20");
  assert.equal(formatVerseList([1, 2, 3, 7, 9, 10, 11]), "1-3, 7, 9-11");
});

test("formatVerseList trie et dédoublonne", () => {
  assert.equal(formatVerseList([18, 16, 17, 16]), "16-18");
});

const data: BibleData = {
  id: "test",
  name: "Test",
  abbrev: "TST",
  books: { John: [[], [], ["v1", "v2", "v3", "v4", "v5"]] },
};
const version = { id: "test", name: "Test", abbrev: "TST" };
const john = booksById.get("John")!;

test("une diapositive par verset", () => {
  const item = buildSelection(data, john, 3, [1, 2, 4], version, "separate")!;
  assert.equal(item.slides.length, 3);
  assert.equal(item.label, "Jean 3.1, 2, 4 · TST");
  assert.deepEqual(
    item.slides.map((s) => s.reference),
    ["Jean 3.1 · TST", "Jean 3.2 · TST", "Jean 3.4 · TST"],
  );
});

test("versets réunis sur une seule diapositive", () => {
  const item = buildSelection(data, john, 3, [1, 2, 4], version, "grouped")!;
  assert.equal(item.slides.length, 1);
  assert.equal(item.slides[0].body, "v1 v2 v4");
  assert.equal(item.slides[0].reference, "Jean 3.1, 2, 4 · TST");
});

test("les versets hors chapitre sont écartés, pas devinés", () => {
  const item = buildSelection(data, john, 3, [4, 5, 99], version, "separate")!;
  assert.equal(item.slides.length, 2);
  assert.equal(item.label, "Jean 3.4, 5 · TST");
});

test("sélection vide ou chapitre inexistant : null", () => {
  assert.equal(buildSelection(data, john, 3, [], version, "separate"), null);
  assert.equal(buildSelection(data, john, 99, [1], version, "separate"), null);
});

test("deux sélections identiques restent deux entrées distinctes", () => {
  const a = buildSelection(data, john, 3, [1], version, "separate")!;
  const b = buildSelection(data, john, 3, [1], version, "separate")!;
  assert.notEqual(a.id, b.id);
});
