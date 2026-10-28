import assert from "node:assert/strict";
import { test } from "node:test";
import { decouperChant } from "./collage.ts";
import type { SongPart } from "./types.ts";

const formes = (texte: string): Array<[string, string]> =>
  decouperChant(texte).map((p: SongPart) => [
    p.number === undefined ? p.kind : `${p.kind}${p.number}`,
    p.body,
  ]);

test("les blocs séparés par une ligne vide deviennent des strophes numérotées", () => {
  assert.deepEqual(formes("Ligne A\nLigne B\n\nLigne C\nLigne D"), [
    ["strophe1", "Ligne A\nLigne B"],
    ["strophe2", "Ligne C\nLigne D"],
  ]);
});

test("une étiquette en tête de bloc donne sa nature et disparaît du texte", () => {
  assert.deepEqual(formes("Ligne A\n\nRefrain\nLigne R"), [
    ["strophe1", "Ligne A"],
    ["refrain", "Ligne R"],
  ]);
});

test("une étiquette seule dans son bloc vaut pour le bloc suivant", () => {
  assert.deepEqual(formes("Ligne A\n\nRefrain\n\nLigne R\nLigne R2"), [
    ["strophe1", "Ligne A"],
    ["refrain", "Ligne R\nLigne R2"],
  ]);
});

test("accents, casse et rang de l'étiquette sont indifférents", () => {
  assert.deepEqual(formes("Couplet 1\nLigne A\n\nREFRAIN 2\nLigne R"), [
    ["strophe1", "Ligne A"],
    ["refrain", "Ligne R"],
  ]);
});

test("un numéro nu étiquette aussi une strophe", () => {
  assert.deepEqual(formes("1.\nLigne A\n\n2.\nLigne B"), [
    ["strophe1", "Ligne A"],
    ["strophe2", "Ligne B"],
  ]);
});

test("les espaces insécables des pages web n'empêchent pas de couper", () => {
  // La ligne « vide » du milieu ne contient qu'un espace insécable.
  assert.equal(formes("Ligne A\n\u00a0\nLigne B").length, 2);
});

test("les retours Windows sont normalisés", () => {
  assert.equal(formes("Ligne A\r\n\r\nLigne B").length, 2);
});

test("le titre n'est pas deviné : la première ligne reste une strophe", () => {
  // Choix délibéré. Deviner le titre avalait toute première strophe d'une
  // seule ligne ; la ligne de trop se supprime d'un clic dans l'éditeur.
  assert.deepEqual(formes("Mon chant\n\nLigne A\nLigne A2"), [
    ["strophe1", "Mon chant"],
    ["strophe2", "Ligne A\nLigne A2"],
  ]);
});

test("aucune convention n'est appliquée : un refrain collé deux fois sort deux fois", () => {
  assert.deepEqual(
    decouperChant("Ligne A\n\nRefrain\nLigne R\n\nLigne B\n\nRefrain\nLigne R").map(
      (p: SongPart) => p.kind,
    ),
    ["strophe", "refrain", "strophe", "refrain"],
  );
});

test("un texte vide ne produit aucune partie", () => {
  assert.deepEqual(decouperChant("   \n\n  "), []);
});
