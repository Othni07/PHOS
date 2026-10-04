# Projecteur

Application de projection de versets bibliques et de cantiques pour le culte,
avec incrustation native dans OBS Studio.

Elle sert **deux publics à la fois** : la salle, par un vidéoprojecteur, et les
spectateurs en ligne, par une incrustation transparente dans OBS.

## Démarrer

Double-cliquez sur **`Demarrer.cmd`** (Windows) ou **`Demarrer.command`**
(macOS), ou en ligne de commande :

```
npm install
npm run dev
```

Laissez la fenêtre du serveur ouverte pendant tout le culte : la fermer coupe
la projection et l'incrustation.

### Sur macOS

Rien à adapter dans le code, mais quatre points diffèrent :

- Au premier usage, si le double-clic ne fait rien : `chmod +x Demarrer.command`.
- **Chrome, pas Safari.** Safari n'implémente pas l'API *Window Management* :
  le bouton « Projeter sur… » ne trouverait aucun écran. Le lanceur ouvre Chrome
  quand il est là.
- Le plein écran est **Ctrl + Cmd + F**, pas `F11`.
- Les six versions sous droits ne sont pas dans le dépôt : un clone frais n'en
  propose que deux. Voir `public/data/SOURCES.md`.

| Page | Adresse | Rôle |
| ---- | ------- | ---- |
| Régie | <http://localhost:5173/console> | La seule à piloter |
| Projection | <http://localhost:5173/projection> | Sortie vidéoprojecteur |
| Overlay | <http://localhost:5173/overlay> | Source Navigateur d'OBS |

Le port est figé : l'URL saisie dans OBS ne doit jamais changer.

## En régie

Tapez une référence ou un titre, `Entrée` projette.

| Saisie | Résultat |
| ------ | -------- |
| `jn 3:16` · `jean 3.16` · `43 3:16` | Jean 3.16 |
| `Ps 23` | le psaume entier, une diapositive par verset |
| `1 co 13:4-7` | la plage demandée |
| `marchons` | le cantique par son titre |

Accents, casse et séparateurs sont indifférents.

| Touche | Effet |
| ------ | ----- |
| `→` `Espace` `PageDown` | diapositive suivante |
| `←` `PageUp` | précédente |
| `B` | écran noir |
| `/` | retour à la recherche |

Les flèches ne franchissent pas la frontière entre versets et cantiques. Sur un
verset, elles poursuivent la lecture dans le texte au-delà du passage choisi,
en franchissant les chapitres.

**« Parcourir la Bible »** ouvre un choix livre → chapitre → versets, avec
sélection multiple (`Maj+clic` pour étendre).
**« Cantiques »** ouvre le formulaire de saisie.

Ce qui apparaît sous le texte projeté : la référence d'un verset, toujours ;
l'étiquette d'un cantique, jamais. « Strophe 2 » n'apprend rien à l'assemblée.
L'opérateur la garde sous les yeux dans le déroulé et sur l'écran « Suivant ».

**Un texte trop haut est réduit automatiquement** pour tenir dans l'écran — le
cas d'un cantique bilingue, qui double le nombre de lignes. Le bandeau défilant,
quand il est actif, voit sa hauteur retirée du calcul. La réduction s'arrête à
40 % : en deçà, coupez la strophe en deux parties.

Cet ajustement ne concerne **que la projection en salle**. L'incrustation OBS
n'est pas touchée : un cantique bilingue y débordera, et la parade est la même,
couper la strophe en deux.

Dans un cantique saisi en régie, **l'ordre des parties à l'écran est celui qui
sera projeté** : les flèches ↑↓ décident. Un refrain n'est donc pas repris
automatiquement après chaque strophe — ajoutez-le où vous le voulez. Les 146
cantiques du recueil livré, eux, suivent la convention « strophe puis refrain ».
**« Apparence OBS »** règle police, taille et opacité de l'incrustation.
**« Projeter sur… »** liste les écrans et ouvre la projection sur le bon.

## OBS

Source **Navigateur**, URL <http://localhost:5173/overlay>, largeur 1920,
hauteur 1080, et **décochez « Fermer la source quand elle n'est pas visible »**.
Placez-la au-dessus de la caméra.

La console diffuse par `BroadcastChannel` — qui ne relie que des onglets d'un
même navigateur — et par un relais WebSocket, seul capable d'atteindre le
Chromium embarqué d'OBS. Le dernier état est rejoué à chaque connexion : une
source recréée en plein culte retrouve l'affichage seule.

## Données

| Fichier | Contenu | Statut |
| ------- | ------- | ------ |
| `public/data/bible-lsg.json` | Louis Segond 1910 | Domaine public |
| `public/data/bible-darby.json` | Darby | Domaine public |
| `public/data/cantiques.json` | Recueil CMR, 146 cantiques | Voir SOURCES.md |

Voir `public/data/SOURCES.md` pour la provenance et les versions écartées, et
`public/data/CANTIQUES.md` pour ajouter des cantiques.

## Documents du projet

| Fichier | Rôle |
| ------- | ---- |
| `ReadMe.pdf` | Document de passation d'origine, §1 à §15. Archive, jamais modifié. |
| `DECISIONS.md` | Décisions prises depuis, et pistes en cours. C'est la suite vivante. |
| `public/data/SOURCES.md` | Provenance des textes bibliques, versions écartées. |
| `public/data/CANTIQUES.md` | Format du recueil et ajout de cantiques. |

## Architecture

Trois pages distinctes plutôt qu'un routeur client : `/projection` a besoin de
son propre `<head>` pour appliquer un fond noir **avant** que React ne démarre.
Si le front plante, la salle voit du noir, jamais du blanc.

**La console décide, tout le reste affiche.** La projection et l'overlay ne
calculent jamais leur propre état — ce qui évite la classe de bugs la plus
pénible en direct, deux écrans qui divergent. Le composant de rendu est
partagé entre l'aperçu de la régie et la sortie réelle : l'aperçu est donc
exact par construction, pas par ressemblance.

`src/platform/` isole les API du navigateur derrière une interface unique. Une
seconde implémentation suffira pour l'enveloppe Tauri prévue en phase 2 ; le
reste du code ne bouge pas.

Le déroulé vit dans `sessionStorage` : il survit à un rechargement accidentel
et disparaît à la fermeture. Les réglages d'apparence et les cantiques saisis
vivent dans `localStorage`, ce sont des préférences.

## Développement

```
npm run dev       # serveur
npm test          # 46 tests
npm run lint
npm run build
```

Convertisseurs de données :

```
npm run bible -- <source.xml> <id> "<nom>" "<abrév>" public/data/bible-<id>.json
python scripts/convert-cantiques.py <recueil.docx> public/data/cantiques.json
```

## Limites connues

- Le relais OBS vit dans le serveur de développement : il disparaît si le
  projet est servi en fichiers statiques.
- Le choix d'écran exige Chrome, Edge ou Brave, et la permission « Gérer les
  fenêtres ». À défaut, la fenêtre s'ouvre à glisser puis `F11`.
- Le recueil ne distingue pas les refrains : le document source ne les
  marquait pas. Voir `CANTIQUES.md`.
