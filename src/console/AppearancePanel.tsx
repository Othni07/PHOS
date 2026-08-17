import { useState } from "react";
import {
  defaultAppearance,
  fontChoices,
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  type OverlayAppearance,
} from "../shared/appearance.ts";
import { OverlayBand } from "../shared/OverlayBand.tsx";
import type { ShowState } from "../types";
import "./AppearancePanel.css";

interface AppearancePanelProps {
  state: ShowState;
  onChange: (appearance: OverlayAppearance) => void;
}

const SAMPLE = {
  kind: "verset" as const,
  reference: "Jean 3.16 · LSG",
  body: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle.",
};

export function AppearancePanel({ state, onChange }: AppearancePanelProps) {
  // Le fond clair est proposé en premier : c'est la situation où le réglage
  // se joue, un texte blanc sur une image blanche restant invisible.
  const [backdrop, setBackdrop] = useState<"clair" | "sombre">("clair");
  const { appearance } = state;

  // Toujours allumé et toujours pourvu d'un texte : on règle l'apparence même
  // quand l'écran est noir ou qu'aucun passage n'est encore à l'antenne.
  const preview: ShowState = {
    ...state,
    slide: state.slide ?? SAMPLE,
    visible: true,
  };

  function set(patch: Partial<OverlayAppearance>) {
    onChange({ ...appearance, ...patch });
  }

  return (
    <section className="appearance" aria-label="Apparence de l'overlay OBS">
      <div className={`appearance__preview appearance__preview--${backdrop}`}>
        <OverlayBand state={preview} />
      </div>

      <div className="appearance__row">
        <span className="appearance__legend">Aperçu sur</span>
        {(["clair", "sombre"] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={`appearance__chip${backdrop === option ? " appearance__chip--on" : ""}`}
            onClick={() => setBackdrop(option)}
          >
            {option === "clair" ? "image claire" : "image sombre"}
          </button>
        ))}
      </div>

      <label className="appearance__field">
        <span className="appearance__label">Police</span>
        <select
          className="appearance__select"
          value={appearance.fontId}
          onChange={(e) => set({ fontId: e.target.value })}
        >
          {fontChoices.map((font) => (
            <option key={font.id} value={font.id}>
              {font.label}
            </option>
          ))}
        </select>
      </label>

      <label className="appearance__field">
        <span className="appearance__label">
          Taille du texte
          <span className="appearance__value">
            {Math.round(appearance.fontScale * 100)} %
          </span>
        </span>
        <input
          type="range"
          min={FONT_SCALE_MIN}
          max={FONT_SCALE_MAX}
          step={0.05}
          value={appearance.fontScale}
          onChange={(e) => set({ fontScale: Number(e.target.value) })}
        />
      </label>

      <label className="appearance__field">
        <span className="appearance__label">
          Opacité du fond
          <span className="appearance__value">
            {Math.round(appearance.bandOpacity * 100)} %
          </span>
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={appearance.bandOpacity}
          onChange={(e) => set({ bandOpacity: Number(e.target.value) })}
        />
      </label>

      <button
        type="button"
        className="appearance__reset"
        onClick={() => onChange(defaultAppearance)}
      >
        Réglages par défaut
      </button>
    </section>
  );
}
