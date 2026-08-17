# Ajouter des cantiques

**Le plus simple : le bouton « Cantiques » de la régie.** Il ouvre un
formulaire — titre, numéro, puis strophes et refrains dans de vrais champs
texte. Rien de ce qui suit n'est nécessaire pour s'en servir.

Ces cantiques sont enregistrés dans le navigateur, sur cette machine. Le
bouton « Exporter mes cantiques » produit un fichier de sauvegarde, que
« Importer » relit — c'est la seule sauvegarde possible tant que
l'application est une page web (§2), et la reprise prévue pour la phase 2.

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

## Les paroles du recueil d'amorce sont à relire

Les six cantiques livrés ont été saisis de mémoire et **n'ont pas été vérifiés
sur une édition papier**. Trois d'entre eux n'ont qu'une seule strophe. Ils
servent à faire tourner la régie, pas à être projetés en culte.

## Importer un recueil existant

Le §11 prévoit l'import depuis OpenLP et VideoPsalm, précisément pour éviter
une resaisie. Si vous disposez d'un export de l'un des deux, le convertir est
un script à écrire — la structure ci-dessus est sa cible.
