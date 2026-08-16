import type { ShowState } from "../types.ts";

/**
 * Pont vers la source Navigateur d'OBS, qui tourne dans un Chromium séparé et
 * ne voit donc pas le BroadcastChannel du navigateur de la régie.
 *
 * La reconnexion est automatique et permanente : OBS peut être lancé avant le
 * serveur, le serveur peut redémarrer en pleine préparation, et l'incrustation
 * doit revenir seule. Un abandon silencieux se paierait en direct.
 */
const PATH = "/obs";
const RETRY_MS = 1000;

export interface Relay {
  /** Publie l'état. Conservé si la liaison est coupée, envoyé au retour. */
  send(state: ShowState): void;
  close(): void;
}

export function connectRelay(onState: ((state: ShowState) => void) | null): Relay {
  let socket: WebSocket | null = null;
  let retry: number | undefined;
  let closed = false;
  let pending: ShowState | null = null;

  function open() {
    if (closed) return;
    const scheme = window.location.protocol === "https:" ? "wss:" : "ws:";
    const next = new WebSocket(`${scheme}//${window.location.host}${PATH}`);
    socket = next;

    next.addEventListener("open", () => {
      if (pending !== null) {
        next.send(JSON.stringify(pending));
        pending = null;
      }
    });

    next.addEventListener("message", (event: MessageEvent<string>) => {
      if (!onState) return;
      try {
        onState(JSON.parse(event.data) as ShowState);
      } catch {
        // Message illisible : on ignore plutôt que de casser l'affichage.
      }
    });

    next.addEventListener("close", () => {
      if (socket === next) socket = null;
      if (!closed) retry = window.setTimeout(open, RETRY_MS);
    });

    next.addEventListener("error", () => next.close());
  }

  open();

  return {
    send(state) {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(state));
      } else {
        // Seul le dernier état compte : rejouer une file entière à la
        // reconnexion ferait défiler l'écran pour rien.
        pending = state;
      }
    },
    close() {
      closed = true;
      window.clearTimeout(retry);
      socket?.close();
    },
  };
}
