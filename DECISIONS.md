# Décisions et pistes

Le document de passation d'origine est `ReadMe.pdf`, à la racine du dépôt. Il
pose les §1 à §15 auxquels renvoient les décisions ci-dessous, et il ne bouge
plus : c'est un PDF vectoriel, sans couche de texte, donc ni modifiable ni
extractible. Il vaut comme archive de l'intention de départ.

Ce fichier-ci est sa suite vivante. Toute décision prise après la passation
s'écrit ici, pas dans le PDF.

Il a failli être perdu : introuvable sur la machine pendant un temps, il a été
retrouvé puis versé au dépôt. C'est aussi ce qui a motivé ce document.

## Principes qui n'ont pas bougé

- **La console décide, tout le reste affiche** (§4). La projection et l'overlay
  ne calculent jamais leur propre état. C'est ce qui évite deux écrans qui
  divergent en direct.
- **L'aperçu est exact par construction** (§4). Le composant de rendu est
  partagé entre la régie et la sortie réelle ; il n'y a pas de « à peu près ».
- **Filet de sécurité noir** (§7). `/projection` pose son fond noir dans son
  `<head>`, avant React. Si le front plante, la salle voit du noir.
- **L'overlay reste transparent** (§7). Aucun fond, aucune couleur : une
  couleur de fond masquerait la caméra dans OBS.
- **Polices système uniquement** (§7). L'application doit démarrer hors ligne.
- **Un projet, un seul emplacement** (§14) : `C:\dev\projecteur`, jamais dans
  un dossier synchronisé par OneDrive.

## Décisions prises depuis

| Sujet | Décision |
| ----- | -------- |
| Versions bibliques | Huit versions utilisables sur la machine, deux seulement versionnées avec le code. Les traductions sous droits sont écartées du dépôt public par `.gitignore` et la régie ne propose que ce qui est présent — voir `public/data/SOURCES.md`. |
| Cantiques | 146 chants du CMR convertis du document Word. Diffusion publique autorisée par le responsable — voir `public/data/CANTIQUES.md`. |
| Déroulé | `sessionStorage` : survit à un rechargement, disparaît à la fermeture. Les réglages, eux, vivent dans `localStorage`. |
| Défilement | Versets et cantiques forment deux couloirs distincts ; les flèches ne franchissent pas la frontière. |
| Fond d'image | Salle uniquement. Jamais dans l'overlay OBS. |
| Dépôt | GitHub, public, `Othni07/PHOS`. |

## Pistes d'amélioration de la régie

Retenues avec le responsable, classées de la plus simple à la plus lourde.
**Les cinq sont faites.**

1. **Le rouge réservé à l'antenne.** Le rouge tally signale aussi l'onglet
   actif, la diapositive sélectionnée et le fond choisi. Le §7 le réserve à ce
   qui est réellement diffusé ; à force de tout signaler, il ne signale plus
   rien.
2. **La progression du déroulé.** Afficher « 2 / 6 » et une barre de
   progression sur le passage courant.
3. **L'échelle typographique.** Huit tailles distinctes se sont accumulées au
   fil des demandes. Trois suffisent : étiquette, corps, titre.
4. **La hiérarchie des actions.** « Projeter » est vu par l'assemblée,
   « Effacer » ne l'est pas : ils ne peuvent pas se ressembler.
5. **Le bloc d'état.** Dans l'espace libre à droite de l'écran « Suivant » :
   heure, temps écoulé depuis le début du culte, et voyants indiquant si la
   salle et l'incrustation reçoivent. C'est la seule piste qui apporte une
   information absente aujourd'hui.

Limite connue du point 5 : le voyant dit qu'une incrustation est branchée, pas
que c'est OBS. Un onglet `/overlay` ouvert dans le navigateur l'allume aussi.
L'étiquette dit donc « incrustation ».

Compter les connexions du relais avait été la première approche du point 5 :
elle annonçait trois clients pour une seule page ouverte, une connexion pouvant
survivre à la page qui l'a créée. Chaque sortie s'annonce désormais par un
battement, qui s'arrête avec elle.

## Ce qui reste hors de ces pistes

- Vérifier le sélecteur d'écran sur un vrai second écran.
- Relire les refrains des cantiques : le document source ne les marquait pas.
- Phase 2 : enveloppe Tauri, bug §8 de la fenêtre blanche, SQLite, serveur
  overlay embarqué en remplacement du relais Vite.
