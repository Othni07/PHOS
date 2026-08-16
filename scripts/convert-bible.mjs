// Convertit une Bible XML vers le JSON compact consommé par l'application.
// Voir §11 du document de contexte : le texte est une table à part, la
// nomenclature française en est une autre.
//
//   node scripts/convert-bible.mjs <source.xml> <id> "<nom>" "<abrév>" <sortie.json>
//
// Deux formats sont reconnus et détectés automatiquement :
//
//   OSIS       <verse osisID='Gen.1.1'>   fichiers Biola/unbound
//   bible.com  <book number="1">…<verse number="1">
//
// L'outil est neutre. Le droit d'embarquer une traduction donnée ne l'est pas :
// voir §13 et public/data/SOURCES.md avant d'ajouter une version.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { books } from "../src/bible/books.ts";

const [, , source, id, name, abbrev, output] = process.argv;

if (!source || !id || !name || !abbrev || !output) {
  console.error(
    'Usage : node scripts/convert-bible.mjs <source.xml> <id> "<nom>" "<abrév>" <sortie.json>',
  );
  process.exit(1);
}

const xml = readFileSync(source, "utf8");

function decodeEntities(text) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&");
}

let strippedMarkers = 0;

function cleanVerse(raw) {
  let text = decodeEntities(raw);
  // Marqueurs de versification hébraïque « (39:1) » présents dans la LSG :
  // informatifs dans un logiciel d'étude, illisibles sur un vidéoprojecteur.
  text = text.replace(/\(\d+:\d+[a-z]?\)\s*/g, () => {
    strippedMarkers += 1;
    return "";
  });
  // Les retours à la ligne poétiques de la source sont normalisés : la mise en
  // page de la projection est décidée par le CSS (text-wrap: balance).
  return text.replace(/\s+/g, " ").trim();
}

/** Place un verset à son index réel : on respecte les trous de la source. */
function place(verses, number, text) {
  verses[number - 1] = text;
}

function toChapters(verses) {
  return Array.from(verses, (v) => v ?? "");
}

let verseCount = 0;
const result = {};

function parseOsis() {
  const bookRe = /<div type='book' osisID='([^']+)'>([\s\S]*?)<\/div>/g;
  for (const [, bookId, bookBody] of xml.matchAll(bookRe)) {
    const chapters = [];
    const chapterRe = /<chapter osisID='[^']+'>([\s\S]*?)<\/chapter>/g;
    for (const [, chapterBody] of bookBody.matchAll(chapterRe)) {
      const verses = [];
      const verseRe = /<verse osisID='([^']+)'>([\s\S]*?)<\/verse>/g;
      for (const [, osisId, rawText] of chapterBody.matchAll(verseRe)) {
        place(verses, Number(osisId.split(".")[2]), cleanVerse(rawText));
        verseCount += 1;
      }
      chapters.push(toChapters(verses));
    }
    result[bookId] = chapters;
  }
}

function parseNumbered() {
  // Le rang canonique 1-66 est la seule clé du format : on le rend à son
  // osisID via la nomenclature, qui reste la source de vérité du canon.
  const byNumber = new Map(books.map((b) => [b.number, b.id]));
  const unknown = new Set();

  const bookRe = /<book number="(\d+)">([\s\S]*?)<\/book>/g;
  for (const [, rawNumber, bookBody] of xml.matchAll(bookRe)) {
    const bookId = byNumber.get(Number(rawNumber));
    if (!bookId) {
      unknown.add(rawNumber);
      continue;
    }
    const chapters = [];
    const chapterRe = /<chapter number="\d+">([\s\S]*?)<\/chapter>/g;
    for (const [, chapterBody] of bookBody.matchAll(chapterRe)) {
      const verses = [];
      const verseRe = /<verse number="(\d+)"[^>]*>([\s\S]*?)<\/verse>/g;
      for (const [, number, rawText] of chapterBody.matchAll(verseRe)) {
        place(verses, Number(number), cleanVerse(rawText));
        verseCount += 1;
      }
      chapters.push(toChapters(verses));
    }
    result[bookId] = chapters;
  }

  if (unknown.size > 0) {
    console.warn(
      `Livres ignorés (hors canon protestant 1-66) : ${[...unknown].join(", ")}`,
    );
  }
}

const isOsis = /<verse\s+osisID=/.test(xml);
if (isOsis) {
  parseOsis();
} else if (/<book\s+number=/.test(xml)) {
  parseNumbered();
} else {
  console.error("Format non reconnu : ni OSIS, ni <book number=…>.");
  process.exit(1);
}

// La mention de droits éventuellement portée par le fichier est affichée telle
// quelle : c'est à la lecture de cette ligne que se décide si la version peut
// être embarquée (§13).
const rights =
  xml.match(/<bible[^>]*\sstatus="([^"]*)"/)?.[1] ??
  xml.match(/<rights>([\s\S]*?)<\/rights>/)?.[1]?.trim();

const bookCount = Object.keys(result).length;
if (bookCount === 0) {
  console.error("Aucun livre extrait : le fichier ne correspond pas au format attendu.");
  process.exit(1);
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify({ id, name, abbrev, books: result }), "utf8");

const sizeMo = (readFileSync(output).length / 1024 / 1024).toFixed(2);
console.log(
  `${name} : ${bookCount} livres, ${verseCount} versets, ` +
    `${strippedMarkers} marqueurs retirés → ${output} (${sizeMo} Mo)`,
);
if (rights) console.log(`Mention de droits du fichier source : ${rights}`);
