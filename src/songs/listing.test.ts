import assert from "node:assert/strict";
import { test } from "node:test";
import { empreinteCantiques, listSongs, mergeSongBook } from "./listing.ts";
import type { Song, SongBook } from "./types.ts";

const chant = (id: string, title: string, number?: number): Song => ({
  id,
  title,
  ...(number === undefined ? {} : { number }),
  parts: [{ kind: "strophe", number: 1, body: `${id}-1` }],
});

const recueil: SongBook = {
  id: "cmr",
  name: "Recueil CMR",
  songs: [chant("gloire", "À toi la gloire", 2), chant("ami", "Quel ami fidèle", 1)],
};

test("le recueil livré est listé, trié par numéro", () => {
  const liste = listSongs(recueil, []);
  assert.deepEqual(
    liste.map((e) => [e.song.id, e.origin]),
    [
      ["ami", "recueil"],
      ["gloire", "recueil"],
    ],
  );
});

test("un cantique saisi sous le même identifiant remplace celui du recueil", () => {
  const corrige: Song = { ...chant("gloire", "À toi la gloire", 2), author: "corrigé" };
  const liste = listSongs(recueil, [corrige]);

  const entree = liste.find((e) => e.song.id === "gloire");
  assert.equal(entree?.origin, "modifie");
  assert.equal(entree?.song.author, "corrigé");
  // Le remplacement ne crée pas de doublon : toujours deux entrées.
  assert.equal(liste.length, 2);

  // Et c'est bien cette version-là que la recherche sortira.
  const fusionne = mergeSongBook(recueil, [corrige]);
  assert.equal(fusionne.songs.filter((s) => s.id === "gloire").length, 1);
  assert.equal(fusionne.songs.find((s) => s.id === "gloire")?.author, "corrigé");
});

test("un cantique saisi sous un identifiant inconnu s'ajoute à la liste", () => {
  const liste = listSongs(recueil, [chant("nouveau", "Chant de la conférence")]);
  const entree = liste.find((e) => e.song.id === "nouveau");
  assert.equal(entree?.origin, "ajoute");
  assert.equal(liste.length, 3);
});

test("sans numéro, le classement se fait sur le titre", () => {
  const liste = listSongs(null, [chant("b", "Bénissons"), chant("a", "Alléluia")]);
  assert.deepEqual(
    liste.map((e) => e.song.title),
    ["Alléluia", "Bénissons"],
  );
  assert.ok(liste.every((e) => e.origin === "ajoute"));
});

test("un cantique numéroté passe devant ceux qui ne le sont pas", () => {
  const liste = listSongs(null, [chant("libre", "Sans numéro"), chant("n", "Numéroté", 9)]);
  assert.deepEqual(
    liste.map((e) => e.song.title),
    ["Numéroté", "Sans numéro"],
  );
});

test("l'empreinte change dès qu'une parole est corrigée", () => {
  const avant = [chant("a", "Alléluia")];
  const apres = [{ ...chant("a", "Alléluia"), parts: [{ kind: "strophe" as const, number: 1, body: "corrigé" }] }];

  assert.equal(empreinteCantiques(avant), empreinteCantiques(avant));
  assert.notEqual(empreinteCantiques(avant), empreinteCantiques(apres));
});

test("l'empreinte distingue un ajout d'une liste vide", () => {
  assert.notEqual(empreinteCantiques([]), empreinteCantiques([chant("a", "Alléluia")]));
});
