import type { ShowState } from "../types";
import "./Output.css";

interface OutputProps {
  state: ShowState;
}

// Composant de rendu partagé entre l'aperçu de la console et la fenêtre de
// projection (§4 — corollaire du principe "la console décide, tout le reste
// affiche"). L'aperçu est donc exact par construction, pas par ressemblance.
export function Output({ state }: OutputProps) {
  const { slide, visible } = state;

  if (!visible || !slide) {
    return <div className="output output--blank" />;
  }

  return (
    <div className="output">
      <p className="output__body">{slide.body}</p>
      <p className="output__reference">{slide.reference}</p>
    </div>
  );
}
