import type { ShowState } from "../types";
import { appearanceVars } from "./appearance.ts";
import "./Output.css";

interface OutputProps {
  state: ShowState;
}

// Composant de rendu partagé entre l'aperçu de la console et la fenêtre de
// projection (§4 — corollaire du principe "la console décide, tout le reste
// affiche"). L'aperçu est donc exact par construction, pas par ressemblance.
export function Output({ state }: OutputProps) {
  const { slide, visible } = state;
  const onAir = visible && slide !== null;

  // Deux niveaux, parce que les deux fondus ne sont pas de même nature :
  // la scène porte l'entrée et la sortie d'antenne par une transition, tandis
  // que chaque diapositive entre par une animation — une transition ne se
  // jouerait pas sur un élément que React vient de remonter.
  return (
    <div className="output" style={appearanceVars(state.appearance)}>
      <div className={`output__stage${onAir ? " output__stage--on" : ""}`}>
        {/* La diapositive reste montée à l'écran noir : « visible: false »
            masque sans décharger (§6), ce qui laisse le fondu de sortie
            se jouer au lieu d'une coupe sèche en pleine salle. */}
        {slide && (
          <div className="output__slide" key={slide.reference + slide.body}>
            <p className="output__body">{slide.body}</p>
            <p className="output__reference">{slide.reference}</p>
          </div>
        )}
      </div>
    </div>
  );
}
