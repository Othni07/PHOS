import type { ShowState } from "../types";
import { defaultAppearance, normalizeAppearance } from "./appearance.ts";

const CHANNEL_NAME = "projecteur";
const STORAGE_KEY = "projecteur.showState";

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

export function loadPersistedState(): ShowState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return reviveShowState(JSON.parse(raw));
  } catch {
    // stockage indisponible, on repart de l'état initial
  }
  return initialShowState;
}

export function createShowBus() {
  const channel = new BroadcastChannel(CHANNEL_NAME);

  return {
    /** Diffuse l'état courant. Appelé uniquement par la console (§4 — seule source de vérité). */
    postState(state: ShowState) {
      const message: Message = { type: "state", payload: state };
      channel.postMessage(message);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
