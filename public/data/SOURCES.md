# Provenance des données bibliques

Les fichiers `bible-*.json` sont **générés**, jamais édités à la main.
Ils proviennent de fichiers OSIS convertis par `scripts/convert-bible.mjs`.

| Fichier             | Version           | Source OSIS  | Statut          |
| ------------------- | ----------------- | ------------ | --------------- |
| `bible-lsg.json`    | Louis Segond 1910 | `fren.xml`   | Domaine public  |
| `bible-darby.json`  | Darby             | `frdarb.xml` | Domaine public  |

Les deux fichiers OSIS sont issus de la distribution *FREE BIBLE SOFTWARE
GROUP* (dépôt Biola/unbound) et portent la mention
« We believe that this Bible ist found in the Public Domain ».

## Régénérer ou ajouter une version

```
npm run bible -- <source.xml> <id> "<nom>" "<abrév>" public/data/bible-<id>.json
```

Exemple :

```
npm run bible -- ~/Downloads/fren.xml lsg "Louis Segond 1910" "LSG" public/data/bible-lsg.json
```

Deux formats XML sont reconnus, détectés automatiquement :

| Format      | Repère                          | Origine typique      |
| ----------- | ------------------------------- | -------------------- |
| OSIS        | `<verse osisID='Gen.1.1'>`      | Biola / unbound      |
| « numéroté »| `<book number="1">` + `<verse number="1">` | exports bible.com |

Le script affiche la **mention de droits portée par le fichier source** à
chaque conversion. Lisez-la : c'est elle qui détermine si la version peut être
embarquée.

Après conversion, déclarer la version dans `src/bible/bible.ts` (tableau
`versions`) pour qu'elle apparaisse dans le sélecteur de la régie.

## Versions volontairement exclues

Le §13 du document de contexte limite l'embarquement aux versions du domaine
public. Les traductions suivantes sont **sous droits** et ne doivent pas être
ajoutées sans licence écrite, même si un fichier est disponible localement :

- Segond 21 (© Société Biblique de Genève)
- Nouvelle Édition de Genève 1979 (© Société Biblique de Genève)
- Bible du Semeur (© Biblica)
- Nouvelle Bible Segond (© Société biblique française — Bibli'O)
- Bible en français courant / Nouvelle français courant (© Bibli'O)

## Traitement appliqué à la conversion

- Les marqueurs de versification hébraïque insérés dans le texte
  (`(39:1)`, `(3:2)`…) sont retirés : informatifs dans un logiciel d'étude,
  illisibles sur un vidéoprojecteur. 1 474 occurrences dans la LSG, 289 dans
  la Darby.
- Les retours à la ligne poétiques de la source sont normalisés en espaces :
  la mise en page est décidée par le CSS de projection.
- Les entités XML sont décodées.
