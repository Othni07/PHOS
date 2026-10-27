import { useEffect, useRef, useState } from "react";
import "./Raccourcis.css";

/**
 * Les raccourcis se transmettaient jusqu'ici de bouche à oreille. Trois d'entre
 * eux portent une étiquette sur leur bouton ; « / », les flèches et le Maj+clic
 * du volet des versets n'étaient écrits nulle part.
 *
 * Le §15 rappelle que le concurrent réel n'est pas un logiciel mais la
 * confiance du technicien : un opérateur qui prend la régie pour la première
 * fois doit pouvoir lire ce que fait le clavier, sans manuel et sans demander.
 */
interface Raccourci {
  touches: string[];
  /** Touches à presser ensemble (« + ») plutôt qu'au choix (« · »). */
  combinaison?: boolean;
  effet: string;
}

const RACCOURCIS: Raccourci[] = [
  { touches: ["→", "Espace", "PageDown"], effet: "Diapositive suivante" },
  { touches: ["←", "PageUp"], effet: "Diapositive précédente" },
  { touches: ["B"], effet: "Écran noir de la salle" },
  { touches: ["N"], effet: "Écran noir de l'incrustation OBS" },
  { touches: ["Maj", "B"], combinaison: true, effet: "Tout couper, ou tout rétablir" },
  { touches: ["/"], effet: "Retour à la recherche" },
  {
    touches: ["Maj", "clic"],
    combinaison: true,
    effet: "Étendre la sélection dans le volet Versets",
  },
  { touches: ["?"], effet: "Cette carte" },
];

export function Raccourcis() {
  const [ouvert, setOuvert] = useState(false);
  const racine = useRef<HTMLDivElement>(null);

  // « ? » ouvre et ferme la carte, où que soit le curseur — sauf dans un champ
  // de saisie, où le point d'interrogation est un caractère comme un autre.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const cible = event.target instanceof Element ? event.target : null;
      if (cible && ["INPUT", "TEXTAREA", "SELECT"].includes(cible.tagName)) return;
      if (event.key === "?") {
        event.preventDefault();
        setOuvert((o) => !o);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!ouvert) return;
    function onClickDehors(event: MouseEvent) {
      if (!racine.current?.contains(event.target as Node)) setOuvert(false);
    }
    function onEchap(event: KeyboardEvent) {
      if (event.key === "Escape") setOuvert(false);
    }
    window.addEventListener("mousedown", onClickDehors);
    window.addEventListener("keydown", onEchap);
    return () => {
      window.removeEventListener("mousedown", onClickDehors);
      window.removeEventListener("keydown", onEchap);
    };
  }, [ouvert]);

  return (
    <div className="raccourcis" ref={racine}>
      <button
        type="button"
        className={`command${ouvert ? " command--armed" : ""}`}
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
      >
        Raccourcis
        <kbd>?</kbd>
      </button>

      {ouvert && (
        <dl className="raccourcis__carte" aria-label="Raccourcis clavier">
          {RACCOURCIS.map(({ touches, combinaison, effet }) => (
            <div key={effet} className="raccourcis__ligne">
              <dt className="raccourcis__touches">
                {touches.map((touche, i) => (
                  <span key={touche}>
                    {i > 0 && (
                      <span className="raccourcis__ou">{combinaison ? "+" : "·"}</span>
                    )}
                    <kbd>{touche}</kbd>
                  </span>
                ))}
              </dt>
              <dd className="raccourcis__effet">{effet}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
