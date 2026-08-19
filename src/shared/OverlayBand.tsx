import type { ShowState } from "../types";
import { appearanceVars } from "./appearance.ts";
import "./OverlayBand.css";

/**
 * Bandeau d'incrustation OBS. Partagé entre la page /overlay et son aperçu
 * dans la régie : régler la police ou l'opacité doit se juger sans passer par
 * OBS, et l'aperçu doit donc être exact par construction, pas par ressemblance.
 */
export function OverlayBand({ state }: { state: ShowState }) {
  const isOnAir = state.visible && state.slide !== null;

  return (
    <div className="overlay" style={appearanceVars(state.appearance)}>
      <div className={`overlay__band${isOnAir ? " overlay__band--on" : ""}`}>
        {state.slide && (
          // La clé change à chaque diapositive : React remonte le bloc, ce qui
          // relance le fondu d'entrée. Sans elle, le texte serait remplacé
          // d'un coup sous un bandeau resté immobile.
          <div className="overlay__text" key={state.slide.reference + state.slide.body}>
            <p className="overlay__body">{state.slide.body}</p>
            <p className="overlay__reference">{state.slide.reference}</p>
          </div>
        )}
      </div>
    </div>
  );
}
