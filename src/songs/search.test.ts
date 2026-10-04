import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseSongQuery,
  partToken,
  renumberParts,
  resolveOrder,
  searchSongs,
  songToItem,
  withExplicitOrder,
} from "./search.ts";
import type { Song, SongBook, SongPart } from "./types.ts";

const book: SongBook = {
  id: "test",
  name: "Recueil de test",
  songs: [
    {
      id: "gloire",
      number: 1,
      title: "À toi la gloire",
      parts: [
        { kind: "strophe", number: 1, body: "S1" },
        { kind: "refrain", body: "R" },
        { kind: "strophe", number: 2, body: "S2" },
      ],
    },
    {
      id: "ami",
      number: 2,
      title: "Quel ami fidèle et tendre",
      parts: [
        { kind: "strophe", number: 1, body: "A1" },
        { kind: "strophe", number: 2, body: "A2" },
      ],
    },
    {
      id: "gloire-au-seigneur",
      number: 12,
      title: "Gloire au Seigneur",
      parts: [{ kind: "strophe", number: 1, body: "G1" }],
    },
    {
      id: "ordonne",
      number: 3,
      title: "Cantique ordonné",
      order: ["r", "s1", "r"],
      parts: [
        { kind: "strophe", number: 1, body: "O1" },
        { kind: "refrain", body: "OR" },
      ],
    },
  ],
};

const bodies = (songId: string) =>
  resolveOrder(book.songs.find((s) => s.id === songId)!).map((p) => p.body);

test("le refrain s'intercale après chaque strophe", () => {
  assert.deepEqual(bodies("gloire"), ["S1", "R", "S2", "R"]);
});

test("sans refrain, les strophes se suivent", () => {
  assert.deepEqual(bodies("ami"), ["A1", "A2"]);
});

test("un ordre explicite l'emporte sur la convention", () => {
  assert.deepEqual(bodies("ordonne"), ["OR", "O1", "OR"]);
});

test("recherche par numéro, nu ou préfixé", () => {
  for (const input of ["1", "#1", " #1 "]) {
    assert.deepEqual(
      searchSongs(book, input).map((s) => s.id),
      ["gloire"],
      input,
    );
  }
});

test("un numéro absent du recueil ne renvoie rien", () => {
  assert.deepEqual(searchSongs(book, "999"), []);
});

test("recherche par titre, insensible aux accents et à la casse", () => {
  for (const input of ["à toi la gloire", "A TOI LA GLOIRE", "atoilagloire"]) {
    assert.equal(searchSongs(book, input)[0]?.id, "gloire", input);
  }
});

test("un titre qui commence par la saisie passe devant celui qui la contient", () => {
  assert.deepEqual(
    searchSongs(book, "gloire").map((s) => s.id),
    ["gloire-au-seigneur", "gloire"],
  );
});

test("frappe partielle sur un fragment de titre", () => {
  assert.equal(searchSongs(book, "quel ami")[0]?.id, "ami");
  assert.equal(searchSongs(book, "fidele")[0]?.id, "ami");
});

test("saisies sans résultat", () => {
  assert.deepEqual(searchSongs(book, ""), []);
  assert.deepEqual(searchSongs(book, "   "), []);
  assert.deepEqual(searchSongs(book, "zzzz"), []);
});

test("parseSongQuery distingue numéro et texte", () => {
  assert.deepEqual(parseSongQuery("42"), { number: 42 });
  assert.deepEqual(parseSongQuery("#42"), { number: 42 });
  assert.deepEqual(parseSongQuery("gloire"), { text: "gloire" });
  assert.equal(parseSongQuery("0"), null);
  assert.equal(parseSongQuery("  "), null);
});

test("mise en diapositives : étiquettes et libellé du déroulé", () => {
  const item = songToItem(book.songs[0]);
  assert.equal(item.kind, "cantique");
  assert.equal(item.label, "1 · À toi la gloire");
  assert.deepEqual(
    item.slides.map((s) => s.reference),
    ["Strophe 1", "Refrain", "Strophe 2", "Refrain"],
  );
  // Le titre n'est jamais projeté (§6) : il ne doit apparaître dans aucun corps.
  assert.ok(item.slides.every((s) => !s.body.includes("À toi la gloire")));
});

// --- Renumérotation et ordre explicite (flèches de l'éditeur) ---

const labels = (parts: SongPart[]) =>
  parts.map((p) => (p.number === undefined ? p.kind : `${p.kind}${p.number}`));

test("la renumérotation comble le trou laissé par une suppression", () => {
  const parts: SongPart[] = [
    { kind: "strophe", number: 2, body: "B" },
    { kind: "strophe", number: 3, body: "C" },
  ];
  assert.deepEqual(labels(renumberParts(parts)), ["strophe1", "strophe2"]);
});

test("une partie unique de sa nature perd son rang, sauf une strophe", () => {
  const parts: SongPart[] = [
    { kind: "strophe", number: 1, body: "S" },
    { kind: "refrain", number: 1, body: "R" },
  ];
  assert.deepEqual(labels(renumberParts(parts)), ["strophe1", "refrain"]);
});

test("deux parties de même nature ne peuvent pas partager un jeton", () => {
  // Cas réel : l'éditeur change la nature d'une partie sans la renuméroter,
  // et deux refrains sans rang porteraient tous deux le jeton « r ».
  const parts: SongPart[] = [
    { kind: "refrain", body: "R1" },
    { kind: "refrain", body: "R2" },
  ];
  const tokens = renumberParts(parts).map(partToken);
  assert.deepEqual(tokens, ["r1", "r2"]);
  assert.equal(new Set(tokens).size, 2);
});

test("l'ordre explicite reproduit la suite des parties, refrain compris", () => {
  const saisi: Song = {
    id: "saisi",
    title: "Cantique saisi en régie",
    parts: [
      { kind: "strophe", number: 1, body: "S1" },
      { kind: "refrain", body: "R" },
      { kind: "strophe", number: 2, body: "S2" },
    ],
  };

  // Sans ordre, la convention intercale le refrain après chaque strophe.
  assert.deepEqual(resolveOrder(saisi).map((p) => p.body), ["S1", "R", "S2", "R"]);

  // Avec l'ordre inscrit par l'éditeur, c'est la suite affichée qui sort.
  const avecOrdre = withExplicitOrder(saisi);
  assert.deepEqual(avecOrdre.order, ["s1", "r", "s2"]);
  assert.deepEqual(resolveOrder(avecOrdre).map((p) => p.body), ["S1", "R", "S2"]);
});

test("l'ordre explicite respecte un réordonnancement par les flèches", () => {
  const remonte: Song = {
    id: "remonte",
    title: "Refrain en tête",
    parts: [
      { kind: "refrain", body: "R" },
      { kind: "strophe", number: 1, body: "S1" },
    ],
  };
  assert.deepEqual(
    resolveOrder(withExplicitOrder(remonte)).map((p) => p.body),
    ["R", "S1"],
  );
});

test("le recueil livré, sans ordre déclaré, garde la convention", () => {
  // Garde-fou : la renumérotation et l'ordre explicite ne touchent que les
  // cantiques passés par l'éditeur. Les 146 cantiques livrés n'en voient rien.
  assert.deepEqual(bodies("gloire"), ["S1", "R", "S2", "R"]);
});
