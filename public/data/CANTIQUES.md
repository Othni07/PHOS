# Ajouter des cantiques

**Le plus simple : le bouton « Cantiques » de la régie.** Il ouvre un
formulaire — titre, numéro, puis strophes et refrains dans de vrais champs
texte. Rien de ce qui suit n'est nécessaire pour s'en servir.

Ces cantiques sont enregistrés dans le navigateur, sur cette machine. Le
bouton « Exporter mes cantiques » produit un fichier de sauvegarde, que
« Importer » relit — c'est la seule sauvegarde possible tant que
l'application est une page web (§2), et la reprise prévue pour la phase 2.

## Le second recueil, alimenté par vous

Un chant saisi en régie ne vit que dans le navigateur d'une machine. Pour qu'il
devienne acquis — présent sur tous les postes, sans export à penser — déposez-le
dans un second recueil que l'application charge à côté du recueil livré.

1. Onglet Cantiques → **« Exporter mes cantiques »**. Le fichier obtenu est déjà
   au bon format, il n'y a rien à transformer.
2. Renommez-le **`cantiques-ajouts.json`** et placez-le dans `public/data/`.
3. Rechargez la régie. Les chants apparaissent dans la liste, comptés avec le
   recueil.

Un chant de ce fichier qui reprend l'`id` d'un cantique livré **le remplace** :
c'est ainsi qu'une correction de paroles devient définitive. Le fichier est
facultatif — une installation qui ne l'a pas charge simplement les 146.

Un fichier mal formé ne casse rien : la régie se rabat sur le recueil livré et
démarre quand même. C'est voulu, un dimanche matin.

**Ce fichier n'entre pas dans le dépôt**, le `.gitignore` l'écarte. La diffusion
des 146 cantiques du CMR a été autorisée par le responsable ; cette autorisation
ne couvre pas un chant trouvé ailleurs. Même garde-fou que les versions
bibliques sous droits — voir `SOURCES.md`. Pour le transporter d'une machine à
l'autre, passez par une clé, pas par GitHub.

Le reste de ce document décrit le fichier livré avec l'application,
`public/data/cantiques.json`, utile pour préparer un recueil entier hors ligne
ou écrire un import. Il est lu au démarrage de la régie : l'enregistrer et
**recharger la page** suffit, sans redémarrer le serveur.

## Le format

Un cantique se décrit par ses **parties**, jamais par un bloc de texte : c'est
ce qui permet de projeter strophe par strophe et de suivre l'ordre réel du
chant.

```json
{
  "id": "quel-ami-fidele",
  "number": 2,
  "title": "Quel ami fidèle et tendre",
  "author": "Joseph Scriven, 1855",
  "parts": [
    { "kind": "strophe", "number": 1, "body": "Première ligne\nDeuxième ligne" },
    { "kind": "refrain", "body": "Ligne du refrain" },
    { "kind": "strophe", "number": 2, "body": "…" }
  ]
}
```

| Champ     | Obligatoire | Rôle |
| --------- | ----------- | ---- |
| `id`      | oui         | Identifiant unique, en minuscules sans accents |
| `title`   | oui         | Titre recherché dans la régie |
| `parts`   | oui         | Les parties, dans l'ordre du recueil |
| `number`  | non         | Numéro au recueil — le moyen de recherche le plus rapide |
| `author`  | non         | Jamais projeté |
| `key`     | non         | Tonalité, pour les musiciens. Jamais projetée |
| `ccli`    | non         | Référence de licence |
| `order`   | non         | Ordre de chant explicite, voir plus bas |

### Les parties

`kind` vaut `strophe`, `refrain`, `pont` ou `final`.
`number` distingue les parties de même nature ; inutile s'il n'y en a qu'une.

Dans `body`, `\n` marque un retour à la ligne. **Ne mettez pas le numéro de
strophe dans le texte** : l'étiquette est générée et affichée à part.

### L'ordre de chant

Par défaut, chaque strophe est suivie du refrain — l'usage le plus courant.
Si le cantique s'en écarte, déclarez `order` avec des jetons :

```json
"order": ["s1", "r", "s2", "s3", "r", "p", "r", "f"]
```

`s1` = strophe 1, `r` = refrain, `r2` = refrain 2, `p` = pont, `f` = final.

## Vérifier après ajout

1. Enregistrez le fichier, rechargez la régie.
2. Tapez le numéro, puis le titre : les deux doivent trouver le cantique.
3. Vérifiez le nombre de diapositives annoncé dans le résultat de recherche.

Une erreur de syntaxe JSON empêche **tout** le recueil de se charger : la
régie affiche alors un message d'erreur sous la recherche. Une virgule en trop
après la dernière entrée d'une liste est la cause la plus fréquente.

## Le recueil livré

`cantiques.json` contient **146 cantiques du CMR**, convertis automatiquement
depuis le document Word de l'assemblée par `scripts/convert-cantiques.py` :

```
python scripts/convert-cantiques.py "<recueil.docx>" public/data/cantiques.json
```

Les paroles viennent du document, elles ne sont pas ressaisies : c'est leur
principale garantie de fidélité.

### Ce que la conversion ne peut pas deviner

Le document source **ne marque pas les refrains** — trois cantiques seulement
portent la mention « Refrain : ». Partout ailleurs, chaque paragraphe devient
une strophe numérotée, et les diapositives se suivent dans l'ordre du
document. C'est projetable tel quel, mais l'alternance strophe/refrain n'est
pas reconstituée.

Corriger un cantique se fait dans la régie, bouton « Cantiques » : la version
corrigée prend le pas sur celle du recueil livré.

Le document ne comporte pas non plus de numérotation. Aucun numéro n'a été
inventé — en attribuer d'arbitraires ferait projeter le mauvais chant à
l'opérateur qui tape un numéro de mémoire. La recherche se fait par titre.

Les couplets anglais des cantiques bilingues sont conservés et placés après
les couplets français.

### Diffusion

Le §13 du document de contexte demandait de clarifier les droits SACEM/CCLI
avant toute diffusion publique. Le responsable du projet a confirmé le
17 août 2026 que ces cantiques peuvent être publiés : le dépôt peut donc être
public sans retirer `cantiques.json`.
