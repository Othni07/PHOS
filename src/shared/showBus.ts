import type { ShowState } from "../types";
import {
  defaultAppearance,
  normalizeAppearance,
  type OverlayAppearance,
} from "./appearance.ts";
import {
  defaultBackground,
  defaultTicker,
  normalizeBackground,
  normalizeTicker,
  type ProjectionBackground,
  type Ticker,
} from "./settings.ts";

const CHANNEL_NAME = "projecteur";

/**
 * L'apparence est un réglage, pas une donnée de culte : elle survit à la
 * fermeture, contrairement au déroulé qui vit le temps d'une session
 * (voir src/console/session.ts). D'où deux stockages distincts.
 */
const SETTINGS_KEY = "projecteur.reglages";

export const initialShowState: ShowState = {
  slide: null,
  visible: false,
  itemIndex: 0,
  slideIndex: 0,
  appearance: defaultAppearance,
  background: defaultBackground,
  ticker: defaultTicker,
};

type Message =
  | { type: "state"; payload: ShowState }
  | { type: "hello" }
  | { type: "alive" };

/** Cadence du battement annonçant qu'une projection est ouverte. */
export const ALIVE_MS = 2000;

/** Un état venu du stockage ou du réseau peut précéder l'ajout d'un champ. */
export function reviveShowState(raw: unknown): ShowState {
  const value = (raw ?? {}) as Partial<ShowState>;
  return {
    ...initialShowState,
    ...value,
    appearance: normalizeAppearance(value.appearance),
    background: normalizeBackground(value.background),
    ticker: normalizeTicker(value.ticker),
  };
}

export interface Settings {
  appearance: OverlayAppearance;
  background: ProjectionBackground;
  ticker: Ticker;
}

export function loadSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const value = JSON.parse(raw) as Partial<Settings>;
      return {
        appearance: normalizeAppearance(value.appearance),
        background: normalizeBackground(value.background),
        ticker: normalizeTicker(value.ticker),
      };
    }
  } catch {
    // stockage indisponible, on repart des réglages par défaut
  }
  return {
    appearance: defaultAppearance,
    background: defaultBackground,
    ticker: defaultTicker,
  };
}

/**
 * État de départ d'une page. Le contenu à l'antenne n'est pas restauré ici :
 * la projection et l'overlay le reçoivent de la console au démarrage (rejeu
 * « hello » et rejeu du relais). Seuls les réglages sont repris, pour éviter
 * que l'incrustation n'apparaisse une fraction de seconde mal réglée.
 */
export function loadPersistedState(): ShowState {
  return { ...initialShowState, ...loadSettings() };
}

export function createShowBus() {
  const channel = new BroadcastChannel(CHANNEL_NAME);

  return {
    /** Diffuse l'état courant. Appelé uniquement par la console (§4 — seule source de vérité). */
    postState(state: ShowState) {
      const message: Message = { type: "state", payload: state };
      channel.postMessage(message);
      try {
        const settings: Settings = {
          appearance: state.appearance,
          background: state.background,
          ticker: state.ticker,
        };
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch {
        // tant pis, la persistance est un confort, pas une garantie
      }
    },
    /**
     * Battement de la fenêtre de projection. La régie n'a aucun autre moyen
     * fiable de savoir qu'une salle est branchée : la fenêtre peut avoir été
     * ouverte à la main plutôt que par le bouton, ou fermée sans prévenir.
     */
    postAlive() {
      const message: Message = { type: "alive" };
      channel.postMessage(message);
    },
    /** Rejeu à l'ouverture — une fenêtre qui vient de s'ouvrir n'a rien reçu. */
    postHello() {
      const message: Message = { type: "hello" };
      channel.postMessage(message);
    },
    onMessage(handler: (msg: Message) => void) {
      const listener = (event: MessageEvent<Message>) => handler(event.data);
      channel.addEventListener("message", listener);
      return () => channel.removeEventListener("message", listener);
    },
    close() {
      channel.close();
    },
  };
}
