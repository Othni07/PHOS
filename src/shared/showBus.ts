import type { ShowState } from "../types";
import {
  defaultAppearance,
  normalizeAppearance,
  type OverlayAppearance,
} from "./appearance.ts";

const CHANNEL_NAME = "projecteur";

/**
 * L'apparence est un réglage, pas une donnée de culte : elle survit à la
 * fermeture, contrairement au déroulé qui vit le temps d'une session
 * (voir src/console/session.ts). D'où deux stockages distincts.
 */
const APPEARANCE_KEY = "projecteur.appearance";

export const initialShowState: ShowState = {
  slide: null,
  visible: false,
  itemIndex: 0,
  slideIndex: 0,
  appearance: defaultAppearance,
};

type Message = { type: "state"; payload: ShowState } | { type: "hello" };

/** Un état venu du stockage ou du réseau peut précéder l'ajout d'un champ. */
export function reviveShowState(raw: unknown): ShowState {
  const value = (raw ?? {}) as Partial<ShowState>;
  return {
    ...initialShowState,
    ...value,
    appearance: normalizeAppearance(value.appearance),
  };
}

export function loadAppearance(): OverlayAppearance {
  try {
    const raw = window.localStorage.getItem(APPEARANCE_KEY);
    if (raw) return normalizeAppearance(JSON.parse(raw));
  } catch {
    // stockage indisponible, on repart des réglages par défaut
  }
  return defaultAppearance;
}

/**
 * État de départ d'une page. Le contenu à l'antenne n'est pas restauré ici :
 * la projection et l'overlay le reçoivent de la console au démarrage (rejeu
 * « hello » et rejeu du relais). Seuls les réglages sont repris, pour éviter
 * que l'incrustation n'apparaisse une fraction de seconde mal réglée.
 */
export function loadPersistedState(): ShowState {
  return { ...initialShowState, appearance: loadAppearance() };
}

export function createShowBus() {
  const channel = new BroadcastChannel(CHANNEL_NAME);

  return {
    /** Diffuse l'état courant. Appelé uniquement par la console (§4 — seule source de vérité). */
    postState(state: ShowState) {
      const message: Message = { type: "state", payload: state };
      channel.postMessage(message);
      try {
        window.localStorage.setItem(
          APPEARANCE_KEY,
          JSON.stringify(state.appearance),
        );
      } catch {
        // tant pis, la persistance est un confort, pas une garantie
      }
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
