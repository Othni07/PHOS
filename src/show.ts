import type { Item } from "./types";

// Déroulé de départ. Les versets ne sont plus codés en dur : ils arrivent par
// la barre de recherche (§11). Ce cantique reste en exemple tant que le
// recueil n'est pas branché — « À toi la gloire » est du domaine public.
export const initialItems: Item[] = [
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
