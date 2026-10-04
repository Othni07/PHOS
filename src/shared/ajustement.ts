import { useLayoutEffect, useRef } from "react";

/** En deçà, le texte serait illisible : mieux vaut couper la strophe en deux. */
const REDUCTION_MAX = 0.4;

/**
 * Réduit un bloc de texte jusqu'à ce qu'il tienne dans la hauteur disponible.
 *
 * Le besoin vient des cantiques bilingues : les deux langues doublent le nombre
 * de lignes et le texte débordait de l'écran, en haut comme en bas, sans que
 * rien en régie ne permette d'y remédier.
 *
 * La réduction est cherchée par dichotomie sur un multiplicateur, jamais en
 * pixels : les tailles restent exprimées en unités de conteneur, donc l'aperçu
 * de la console demeure une réduction fidèle de ce qui sort réellement.
 *
 * La mesure a lieu avant la peinture : aucun débordement n'est jamais visible.
 *
 * Ne concerne que la projection en salle. L'incrustation OBS n'est pas touchée.
 *
 * @param cle change à chaque diapositive, pour remesurer.
 */
export function useAjustement<C extends HTMLElement, T extends HTMLElement>(cle: string) {
  const cadre = useRef<C>(null);
  const contenu = useRef<T>(null);

  useLayoutEffect(() => {
    const dehors = cadre.current;
    const dedans = contenu.current;
    if (!dehors || !dedans) return;

    function ajuster() {
      if (!dehors || !dedans) return;
      const place = dehors.clientHeight;
      const tient = (facteur: number) => {
        dedans.style.setProperty("--corps-ajuste", String(facteur));
        return dedans.getBoundingClientRect().height <= place;
      };

      // Le cas courant — un verset, une strophe seule — tient à pleine taille
      // et ne coûte qu'une seule mesure.
      if (tient(1)) return;

      let possible = REDUCTION_MAX;
      let impossible = 1;
      for (let i = 0; i < 8; i += 1) {
        const milieu = (possible + impossible) / 2;
        if (tient(milieu)) possible = milieu;
        else impossible = milieu;
      }
      dedans.style.setProperty("--corps-ajuste", String(possible));
    }

    ajuster();

    // La fenêtre de projection naît en 1280x720 puis passe en plein écran, la
    // console se redimensionne, OBS redimensionne sa source : sans cela la
    // taille resterait calée sur une hauteur qui n'existe plus. Deux sources
    // plutôt qu'une — l'observateur voit les changements de mise en page qui ne
    // touchent pas la fenêtre, l'événement de fenêtre passe là où l'observateur
    // reste muet.
    const observateur = new ResizeObserver(ajuster);
    observateur.observe(dehors);
    window.addEventListener("resize", ajuster);
    return () => {
      observateur.disconnect();
      window.removeEventListener("resize", ajuster);
    };
  }, [cle]);

  return { cadre, contenu };
}
