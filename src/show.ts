import type { Item } from "./types";

// Contenu de démonstration codé en dur — §10.2 de la feuille de route.
// Sera remplacé par la Bible LSG en JSON et un recueil de cantiques (étape 5).
export const items: Item[] = [
  {
    id: "jean-3-16",
    kind: "verset",
    label: "Jean 3.16",
    slides: [
      {
        kind: "verset",
        reference: "Jean 3.16 · LSG",
        body: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique,\nafin que quiconque croit en lui ne périsse point,\nmais qu'il ait la vie éternelle.",
      },
    ],
  },
  {
    id: "psaume-23",
    kind: "verset",
    label: "Psaume 23.1-3",
    slides: [
      {
        kind: "verset",
        reference: "Psaume 23.1 · LSG",
        body: "L'Éternel est mon berger : je ne manquerai de rien.",
      },
      {
        kind: "verset",
        reference: "Psaume 23.2 · LSG",
        body: "Il me fait reposer dans de verts pâturages,\nIl me dirige près des eaux paisibles.",
      },
      {
        kind: "verset",
        reference: "Psaume 23.3 · LSG",
        body: "Il restaure mon âme,\nIl me conduit dans les sentiers de la justice,\nÀ cause de son nom.",
      },
    ],
  },
  {
    id: "a-toi-la-gloire",
    kind: "cantique",
    label: "À toi la gloire",
    slides: [
      {
        kind: "cantique",
        reference: "Strophe 1",
        body: "À toi la gloire, ô Ressuscité !\nÀ toi la victoire pour l'éternité !\nBrillant de lumière, l'ange est descendu,\nIl roule la pierre du tombeau vaincu.",
      },
      {
        kind: "cantique",
        reference: "Refrain",
        body: "À toi la gloire, ô Ressuscité !\nÀ toi la victoire pour l'éternité !",
      },
      {
        kind: "cantique",
        reference: "Strophe 2",
        body: "Vois-le paraître : c'est lui, c'est Jésus,\nTon Sauveur, ton Maître, oh ! ne doute plus !\nSois dans l'allégresse, peuple du Seigneur,\nEt redis sans cesse : le Christ est vainqueur !",
      },
      {
        kind: "cantique",
        reference: "Refrain",
        body: "À toi la gloire, ô Ressuscité !\nÀ toi la victoire pour l'éternité !",
      },
      {
        kind: "cantique",
        reference: "Strophe 3",
        body: "Craindrais-je encore ? Il vit à jamais,\nCelui que j'adore, le Prince de paix ;\nIl est ma victoire, mon puissant soutien,\nMa vie et ma gloire : non, je ne crains rien !",
      },
      {
        kind: "cantique",
        reference: "Refrain",
        body: "À toi la gloire, ô Ressuscité !\nÀ toi la victoire pour l'éternité !",
      },
    ],
  },
];
