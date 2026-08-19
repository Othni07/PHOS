import { useEffect, useState } from "react";
import type { ShowState } from "../types";
import { appearanceVars } from "./appearance.ts";
import { loadBackgrounds } from "./backgrounds.ts";
import { projectionVars } from "./settings.ts";
import "./Output.css";

interface OutputProps {
  state: ShowState;
}

/**
 * Les images sont lues depuis le stockage, jamais transportées par le canal
 * d'état : envoyer une image entière à chaque changement de verset serait
 * absurde. Le cache évite de relire le stockage à chaque rendu.
 */
const cache = new Map<string, string>();

function useBackgroundImage(imageId: string | null): string | null {
  const [url, setUrl] = useState<string | null>(() =>
    imageId ? (cache.get(imageId) ?? null) : null,
  );

  useEffect(() => {
    if (!imageId) {
      setUrl(null);
      return;
    }
    const known = cache.get(imageId);
    if (known) {
      setUrl(known);
      return;
    }
    let cancelled = false;
    void loadBackgrounds().then((images) => {
      const found = images.find((image) => image.id === imageId);
      if (found) cache.set(found.id, found.dataUrl);
      if (!cancelled) setUrl(found?.dataUrl ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [imageId]);

  return url;
}

// Composant de rendu partagé entre l'aperçu de la console et la fenêtre de
// projection (§4 — corollaire du principe "la console décide, tout le reste
// affiche"). L'aperçu est donc exact par construction, pas par ressemblance.
export function Output({ state }: OutputProps) {
  const { slide, visible, background, ticker } = state;
  const onAir = visible && slide !== null;
  const imageUrl = useBackgroundImage(background.imageId);

  return (
    <div
      className="output"
      style={{ ...appearanceVars(state.appearance), ...projectionVars(background, ticker) }}
    >
      {/* Le fond reste en place quand l'écran passe au noir : il n'appartient
          pas au contenu projeté, c'est le décor de la salle. */}
      {imageUrl && (
        <div className="output__fond" style={{ backgroundImage: `url(${imageUrl})` }} />
      )}

      {/* Deux niveaux, parce que les deux fondus ne sont pas de même nature :
          la scène porte l'entrée et la sortie d'antenne par une transition,
          tandis que chaque diapositive entre par une animation — une
          transition ne se jouerait pas sur un élément que React remonte. */}
      <div className={`output__stage${onAir ? " output__stage--on" : ""}`}>
        {slide && (
          <div className="output__slide" key={slide.reference + slide.body}>
            <p className="output__body">{slide.body}</p>
            <p className="output__reference">{slide.reference}</p>
          </div>
        )}
      </div>

      {ticker.enabled && (
        <div className="output__ticker">
          {/* Le texte est répété : le second exemplaire entre par la droite au
              moment où le premier sort, ce qui donne un défilement continu
              plutôt qu'un blanc entre deux passages. */}
          <div className="output__ticker-track">
            <span className="output__ticker-text">{ticker.text}</span>
            <span className="output__ticker-text" aria-hidden="true">
              {ticker.text}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
