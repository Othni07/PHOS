import assert from "node:assert/strict";
import { test } from "node:test";
import { formatReference, parseReference } from "./reference.ts";

/** Raccourci de lecture : « Jean|3|16|18 » ou null. */
function parsed(input: string): string | null {
  const r = parseReference(input);
  if (!r) return null;
  return [r.book.name, r.chapter, r.verseStart ?? "", r.verseEnd ?? ""].join("|");
}

test("exemples du document §11", () => {
  assert.equal(parsed("jn 3:16"), "Jean|3|16|");
  assert.equal(parsed("Ps 23"), "Psaumes|23||");
});

test("alias de Jean — jean, jn, john, jhn, 43", () => {
  for (const input of ["jean 3:16", "jn 3:16", "john 3:16", "jhn 3:16", "43 3:16"]) {
    assert.equal(parsed(input), "Jean|3|16|", input);
  }
});

test("insensible aux accents et à la casse", () => {
  assert.equal(parsed("genese 1:1"), "Genèse|1|1|");
  assert.equal(parsed("Genèse 1:1"), "Genèse|1|1|");
  assert.equal(parsed("GENESE 1:1"), "Genèse|1|1|");
  assert.equal(parsed("ésaïe 40"), "Ésaïe|40||");
  assert.equal(parsed("esaie 40"), "Ésaïe|40||");
});

test("livres numérotés — 1 corinthiens, 1co, 1 Co", () => {
  for (const input of ["1 corinthiens 13:4", "1co 13:4", "1 Co 13:4", "1cor 13:4"]) {
    assert.equal(parsed(input), "1 Corinthiens|13|4|", input);
  }
});

test("séparateurs interchangeables", () => {
  for (const input of ["jn 3:16", "jn 3.16", "jn 3,16", "jn 3 16", "jn3:16"]) {
    assert.equal(parsed(input), "Jean|3|16|", input);
  }
});

test("plages de versets", () => {
  assert.equal(parsed("1 co 13:4-7"), "1 Corinthiens|13|4|7");
  assert.equal(parsed("Jean 3.16-18"), "Jean|3|16|18");
});

test("plage inversée : on retombe sur le verset de départ", () => {
  assert.equal(parsed("Jean 3.16-12"), "Jean|3|16|");
});

test("chapitre entier et livre seul", () => {
  assert.equal(parsed("Ps 23"), "Psaumes|23||");
  assert.equal(parsed("jean"), "Jean|1||");
});

test("frappe partielle acceptée si non ambiguë", () => {
  assert.equal(parsed("psau 23"), "Psaumes|23||");
  // « j » désigne Josué, Juges, Job, Jean… : refus plutôt que devinette.
  assert.equal(parsed("j 3:16"), null);
});

test("cantique des cantiques", () => {
  assert.equal(parsed("cantique 2:1"), "Cantique des cantiques|2|1|");
  assert.equal(parsed("ct 2:1"), "Cantique des cantiques|2|1|");
});

test("saisies invalides", () => {
  assert.equal(parsed(""), null);
  assert.equal(parsed("   "), null);
  assert.equal(parsed("zzz 3:16"), null);
  assert.equal(parsed("119"), null);
});

test("formatage à la française", () => {
  assert.equal(formatReference(parseReference("jn 3:16")!), "Jean 3.16");
  assert.equal(formatReference(parseReference("Ps 23")!), "Psaume 23");
  assert.equal(formatReference(parseReference("1 co 13:4-7")!), "1 Corinthiens 13.4-7");
});
