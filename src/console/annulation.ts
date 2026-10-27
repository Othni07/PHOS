import { useCallback, useState } from "react";

interface Memoire<T> {
  valeur: T;
  libelle: string;
}

/**
 * Mémoire d'une suppression, le temps de la défaire.
 *
 * Une confirmation avant chaque suppression mettrait du frottement sur le
 * geste courant pour protéger le cas rare. On laisse donc supprimer sans rien
 * demander, et on garde de quoi revenir en arrière : c'est le mauvais clic
 * qu'il faut rattraper, pas le bon qu'il faut ralentir.
 *
 * Aucune expiration. Un bandeau qui s'efface au bout de quelques secondes ne
 * sert à rien à qui relève les yeux de son clavier une demi-minute plus tard,
 * et c'est précisément ce que fait un opérateur en plein culte. Il disparaît
 * quand on s'en sert, quand on le masque, ou quand une autre suppression le
 * remplace.
 */
export function useAnnulation<T>() {
  const [memoire, setMemoire] = useState<Memoire<T> | null>(null);

  const memoriser = useCallback((valeur: T, libelle: string) => {
    setMemoire({ valeur, libelle });
  }, []);

  const oublier = useCallback(() => setMemoire(null), []);

  return { memoire, memoriser, oublier };
}
