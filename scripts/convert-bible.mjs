// Convertit une Bible au format OSIS (fichiers Biola/unbound) vers le JSON
// compact consommé par l'application. Voir §11 du document de contexte :
// le texte est une table à part, la nomenclature française en est une autre.
//
//   node scripts/convert-bible.mjs <source.xml> <id> "<nom>" "<abrév>" <sortie.json>

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

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

const books = {};
let bookCount = 0;
let verseCount = 0;

const bookRe = /<div type='book' osisID='([^']+)'>([\s\S]*?)<\/div>/g;
for (const [, bookId, bookBody] of xml.matchAll(bookRe)) {
  const chapters = [];
  const chapterRe = /<chapter osisID='[^']+'>([\s\S]*?)<\/chapter>/g;
  for (const [, chapterBody] of bookBody.matchAll(chapterRe)) {
    const verses = [];
    const verseRe = /<verse osisID='([^']+)'>([\s\S]*?)<\/verse>/g;
    for (const [, osisId, rawText] of chapterBody.matchAll(verseRe)) {
      const number = Number(osisId.split(".")[2]);
      // L'index du tableau est le numéro de verset - 1 : on respecte les trous
      // éventuels de la source plutôt que de décaler silencieusement.
      verses[number - 1] = cleanVerse(rawText);
      verseCount += 1;
    }
    chapters.push(Array.from(verses, (v) => v ?? ""));
  }
  books[bookId] = chapters;
  bookCount += 1;
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify({ id, name, abbrev, books }), "utf8");

const sizeMo = (readFileSync(output).length / 1024 / 1024).toFixed(2);
console.log(
  `${name} : ${bookCount} livres, ${verseCount} versets, ` +
    `${strippedMarkers} marqueurs retirés → ${output} (${sizeMo} Mo)`,
);
