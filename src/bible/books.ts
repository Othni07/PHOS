// Nomenclature française des livres bibliques + alias de recherche (§11).
// Table séparée du texte : changer de version ne change pas les noms, et
// ajouter une langue n'oblige pas à retoucher les données bibliques. C'est la
// correction du défaut constaté chez FreeShow, où les noms restent en anglais.

export interface BookInfo {
  /** osisID — clé dans les fichiers de texte biblique. */
  id: string;
  /** Rang canonique 1-66, utilisable comme raccourci de saisie. */
  number: number;
  name: string;
  /** Forme employée dans une référence quand elle diffère du nom du livre :
   *  on projette « Psaume 23 », pas « Psaumes 23 ». */
  refName?: string;
  abbrev: string;
  testament: "AT" | "NT";
  /** Saisies supplémentaires non déductibles du nom (anglais, codes usuels). */
  extras: string[];
}

export const books: BookInfo[] = [
  { id: "Gen", number: 1, name: "Genèse", abbrev: "Gn", testament: "AT", extras: ["genesis", "gen"] },
  { id: "Exod", number: 2, name: "Exode", abbrev: "Ex", testament: "AT", extras: ["exodus", "exo"] },
  { id: "Lev", number: 3, name: "Lévitique", abbrev: "Lv", testament: "AT", extras: ["leviticus", "lev"] },
  { id: "Num", number: 4, name: "Nombres", abbrev: "Nb", testament: "AT", extras: ["numbers", "nom", "num"] },
  { id: "Deut", number: 5, name: "Deutéronome", abbrev: "Dt", testament: "AT", extras: ["deuteronomy", "deut", "deu"] },
  { id: "Josh", number: 6, name: "Josué", abbrev: "Jos", testament: "AT", extras: ["joshua", "jsh"] },
  { id: "Judg", number: 7, name: "Juges", abbrev: "Jg", testament: "AT", extras: ["judges", "jug", "jdg"] },
  { id: "Ruth", number: 8, name: "Ruth", abbrev: "Rt", testament: "AT", extras: ["rut"] },
  { id: "1Sam", number: 9, name: "1 Samuel", abbrev: "1S", testament: "AT", extras: ["1sa", "1sam"] },
  { id: "2Sam", number: 10, name: "2 Samuel", abbrev: "2S", testament: "AT", extras: ["2sa", "2sam"] },
  { id: "1Kgs", number: 11, name: "1 Rois", abbrev: "1R", testament: "AT", extras: ["1kings", "1kgs", "1ro"] },
  { id: "2Kgs", number: 12, name: "2 Rois", abbrev: "2R", testament: "AT", extras: ["2kings", "2kgs", "2ro"] },
  { id: "1Chr", number: 13, name: "1 Chroniques", abbrev: "1Ch", testament: "AT", extras: ["1chronicles", "1chr"] },
  { id: "2Chr", number: 14, name: "2 Chroniques", abbrev: "2Ch", testament: "AT", extras: ["2chronicles", "2chr"] },
  { id: "Ezra", number: 15, name: "Esdras", abbrev: "Esd", testament: "AT", extras: ["ezra", "esr"] },
  { id: "Neh", number: 16, name: "Néhémie", abbrev: "Né", testament: "AT", extras: ["nehemiah", "neh"] },
  { id: "Esth", number: 17, name: "Esther", abbrev: "Est", testament: "AT", extras: ["esth"] },
  { id: "Job", number: 18, name: "Job", abbrev: "Jb", testament: "AT", extras: [] },
  { id: "Ps", number: 19, name: "Psaumes", refName: "Psaume", abbrev: "Ps", testament: "AT", extras: ["psaume", "psalm", "psalms", "psa"] },
  { id: "Prov", number: 20, name: "Proverbes", abbrev: "Pr", testament: "AT", extras: ["proverbs", "prov", "pro"] },
  { id: "Eccl", number: 21, name: "Ecclésiaste", abbrev: "Ec", testament: "AT", extras: ["ecclesiastes", "eccl", "qohelet"] },
  { id: "Song", number: 22, name: "Cantique des cantiques", abbrev: "Ct", testament: "AT", extras: ["cantique", "cantiques", "cant", "songofsolomon", "song", "sos"] },
  { id: "Isa", number: 23, name: "Ésaïe", abbrev: "És", testament: "AT", extras: ["isaiah", "isa", "esa", "isaie"] },
  { id: "Jer", number: 24, name: "Jérémie", abbrev: "Jr", testament: "AT", extras: ["jeremiah", "jer"] },
  { id: "Lam", number: 25, name: "Lamentations", abbrev: "Lm", testament: "AT", extras: ["lam"] },
  { id: "Ezek", number: 26, name: "Ézéchiel", abbrev: "Éz", testament: "AT", extras: ["ezekiel", "ezek", "eze"] },
  { id: "Dan", number: 27, name: "Daniel", abbrev: "Dn", testament: "AT", extras: ["dan"] },
  { id: "Hos", number: 28, name: "Osée", abbrev: "Os", testament: "AT", extras: ["hosea", "hos"] },
  { id: "Joel", number: 29, name: "Joël", abbrev: "Jl", testament: "AT", extras: ["joe"] },
  { id: "Amos", number: 30, name: "Amos", abbrev: "Am", testament: "AT", extras: ["amo"] },
  { id: "Obad", number: 31, name: "Abdias", abbrev: "Ab", testament: "AT", extras: ["obadiah", "obad", "oba"] },
  { id: "Jonah", number: 32, name: "Jonas", abbrev: "Jon", testament: "AT", extras: ["jonah"] },
  { id: "Mic", number: 33, name: "Michée", abbrev: "Mi", testament: "AT", extras: ["micah", "mic"] },
  { id: "Nah", number: 34, name: "Nahum", abbrev: "Na", testament: "AT", extras: ["nah"] },
  { id: "Hab", number: 35, name: "Habacuc", abbrev: "Ha", testament: "AT", extras: ["habakkuk", "hab"] },
  { id: "Zeph", number: 36, name: "Sophonie", abbrev: "So", testament: "AT", extras: ["zephaniah", "zeph", "sop"] },
  { id: "Hag", number: 37, name: "Aggée", abbrev: "Ag", testament: "AT", extras: ["haggai", "hag"] },
  { id: "Zech", number: 38, name: "Zacharie", abbrev: "Za", testament: "AT", extras: ["zechariah", "zech", "zac"] },
  { id: "Mal", number: 39, name: "Malachie", abbrev: "Ml", testament: "AT", extras: ["malachi", "mal"] },
  { id: "Matt", number: 40, name: "Matthieu", abbrev: "Mt", testament: "NT", extras: ["matthew", "matt", "mat"] },
  { id: "Mark", number: 41, name: "Marc", abbrev: "Mc", testament: "NT", extras: ["mark", "mrk", "mar"] },
  { id: "Luke", number: 42, name: "Luc", abbrev: "Lc", testament: "NT", extras: ["luke", "luk"] },
  { id: "John", number: 43, name: "Jean", abbrev: "Jn", testament: "NT", extras: ["john", "jhn"] },
  { id: "Acts", number: 44, name: "Actes", abbrev: "Ac", testament: "NT", extras: ["acts", "act"] },
  { id: "Rom", number: 45, name: "Romains", abbrev: "Rm", testament: "NT", extras: ["romans", "rom", "ro"] },
  { id: "1Cor", number: 46, name: "1 Corinthiens", abbrev: "1Co", testament: "NT", extras: ["1corinthians", "1cor"] },
  { id: "2Cor", number: 47, name: "2 Corinthiens", abbrev: "2Co", testament: "NT", extras: ["2corinthians", "2cor"] },
  { id: "Gal", number: 48, name: "Galates", abbrev: "Ga", testament: "NT", extras: ["galatians", "gal"] },
  { id: "Eph", number: 49, name: "Éphésiens", abbrev: "Ép", testament: "NT", extras: ["ephesians", "eph", "ephesiens"] },
  { id: "Phil", number: 50, name: "Philippiens", abbrev: "Ph", testament: "NT", extras: ["philippians", "phil", "php"] },
  { id: "Col", number: 51, name: "Colossiens", abbrev: "Col", testament: "NT", extras: ["colossians"] },
  { id: "1Thess", number: 52, name: "1 Thessaloniciens", abbrev: "1Th", testament: "NT", extras: ["1thessalonians", "1thess", "1the"] },
  { id: "2Thess", number: 53, name: "2 Thessaloniciens", abbrev: "2Th", testament: "NT", extras: ["2thessalonians", "2thess", "2the"] },
  { id: "1Tim", number: 54, name: "1 Timothée", abbrev: "1Tm", testament: "NT", extras: ["1timothy", "1tim", "1ti"] },
  { id: "2Tim", number: 55, name: "2 Timothée", abbrev: "2Tm", testament: "NT", extras: ["2timothy", "2tim", "2ti"] },
  { id: "Titus", number: 56, name: "Tite", abbrev: "Tt", testament: "NT", extras: ["titus", "tit"] },
  { id: "Phlm", number: 57, name: "Philémon", abbrev: "Phm", testament: "NT", extras: ["philemon", "phlm", "philemon"] },
  { id: "Heb", number: 58, name: "Hébreux", abbrev: "Hé", testament: "NT", extras: ["hebrews", "heb", "hebreux"] },
  { id: "Jas", number: 59, name: "Jacques", abbrev: "Jc", testament: "NT", extras: ["james", "jas", "jac"] },
  { id: "1Pet", number: 60, name: "1 Pierre", abbrev: "1P", testament: "NT", extras: ["1peter", "1pet", "1pi"] },
  { id: "2Pet", number: 61, name: "2 Pierre", abbrev: "2P", testament: "NT", extras: ["2peter", "2pet", "2pi"] },
  { id: "1John", number: 62, name: "1 Jean", abbrev: "1Jn", testament: "NT", extras: ["1john", "1jhn"] },
  { id: "2John", number: 63, name: "2 Jean", abbrev: "2Jn", testament: "NT", extras: ["2john", "2jhn"] },
  { id: "3John", number: 64, name: "3 Jean", abbrev: "3Jn", testament: "NT", extras: ["3john", "3jhn"] },
  { id: "Jude", number: 65, name: "Jude", abbrev: "Jude", testament: "NT", extras: ["jud"] },
  { id: "Rev", number: 66, name: "Apocalypse", abbrev: "Ap", testament: "NT", extras: ["revelation", "rev", "apo"] },
];

/**
 * Minuscules, sans accents, sans ponctuation ni espaces.
 * « 1 Corinthiens » → « 1corinthiens », « Genèse » → « genese ».
 */
export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export const booksById = new Map(books.map((b) => [b.id, b]));

/** Alias exact → livre. Construit une fois au chargement du module. */
export const aliasIndex = new Map<string, BookInfo>();

for (const book of books) {
  const candidates = [
    book.name,
    book.abbrev,
    book.id,
    String(book.number),
    ...book.extras,
  ];
  for (const candidate of candidates) {
    const key = normalize(candidate);
    // Le premier inscrit gagne : les livres numérotés (1 Jean) ne doivent pas
    // écraser un alias déjà revendiqué par un livre plus courant.
    if (key && !aliasIndex.has(key)) aliasIndex.set(key, book);
  }
}
