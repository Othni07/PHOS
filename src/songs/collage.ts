// Découpage d'un chant collé d'un bloc.
//
// Le besoin vient de l'usage : un chant manque au répertoire, on le trouve en
// une minute sur une page web, et on passait dix minutes à le faire entrer —
// l'éditeur obligeait à créer chaque partie une par une. Coller d'un coup
// ramène ça à un geste.
//
// Aucune dépendance à la plateforme : comme search.ts, ce module est testable
// seul. Aucun réseau non plus — c'est l'opérateur qui apporte le texte.

import { normalize } from "../bible/books.ts";
import { renumberParts } from "./search.ts";
import type { SongPart, SongPartKind } from "./types.ts";

/**
 * Étiquettes reconnues en tête de bloc. `normalize` efface accents, casse et
 * espaces : « REFRAIN 2 » arrive ici sous la forme « refrain2 », d'où le `\d*`.
 */
const ETIQUETTES: Array<{ motif: RegExp; kind: SongPartKind }> = [
  { motif: /^(refrain|chorus)\d*$/, kind: "refrain" },
  { motif: /^(pont|bridge|interlude)\d*$/, kind: "pont" },
  { motif: /^(final|coda|fin|outro)\d*$/, kind: "final" },
  { motif: /^(couplet|strophe|verse)\d*$/, kind: "strophe" },
  // Les pages web numérotent souvent les strophes sans autre mot : « 2. »
  { motif: /^\d+$/, kind: "strophe" },
];

function etiquette(ligne: string): SongPartKind | null {
  const cle = normalize(ligne);
  if (cle === "") return null;
  return ETIQUETTES.find(({ motif }) => motif.test(cle))?.kind ?? null;
}

/**
 * Découpe le texte en parties : un bloc par groupe de lignes, les blocs étant
 * séparés par une ligne vide. Une ligne seule portant « Refrain », « Pont » ou
 * un simple numéro donne sa nature au bloc et disparaît du texte projeté.
 *
 * Aucune convention n'est appliquée à l'ordre : la suite obtenue est celle du
 * texte collé. Si le refrain y figure trois fois, il sortira trois fois.
 *
 * Le titre n'est pas deviné. Une première version reprenait la première ligne
 * isolée du collage — une page web commence presque toujours par le titre du
 * chant — mais à l'épreuve elle avalait aussi toute première strophe tenant sur
 * une ligne, soit trois cas sur dix du jeu d'essai. Une règle prévisible vaut
 * mieux qu'une heuristique qui surprend : le titre se saisit dans son champ, et
 * la ligne de trop se supprime d'un clic dans l'éditeur, qui montre le
 * découpage avant d'enregistrer.
 */
export function decouperChant(texte: string): SongPart[] {
  const propre = texte
    .replace(/\r\n?/g, "\n")
    // Les pages web sont pleines d'espaces insécables, invisibles à la lecture
    // mais qui empêchent une ligne d'être reconnue comme vide.
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+$/gm, "");

  const blocs = propre
    .split(/\n{2,}/)
    .map((bloc) => bloc.trim())
    .filter((bloc) => bloc !== "");

  const parts: SongPart[] = [];
  let enAttente: SongPartKind | null = null;

  for (const bloc of blocs) {
    const lignes = bloc.split("\n");
    const kind = etiquette(lignes[0]);
    const corps = (kind === null ? lignes : lignes.slice(1)).join("\n").trim();

    // Bloc ne contenant que son étiquette : elle vaut pour le bloc suivant.
    if (corps === "") {
      if (kind !== null) enAttente = kind;
      continue;
    }

    parts.push({ kind: kind ?? enAttente ?? "strophe", body: corps });
    enAttente = null;
  }

  return renumberParts(parts);
}
