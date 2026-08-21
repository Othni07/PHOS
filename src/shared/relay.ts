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
  /** Signale que cette page est une incrustation vivante. */
  sendAlive(): void;
  close(): void;
}

/**
 * Battement par lequel l'incrustation signale sa présence. Compter les
 * connexions du serveur s'était révélé trompeur — une connexion peut survivre
 * à la page qui l'a ouverte. Un battement, lui, s'arrête avec elle.
 */
const BATTEMENT = { __projecteur: "overlay-alive" } as const;

interface Service {
  __projecteur: "overlay-alive";
}

export function connectRelay(
  onState: ((state: ShowState) => void) | null,
  onOverlayAlive?: () => void,
): Relay {
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
      try {
        const recu = JSON.parse(event.data) as ShowState | Service;
        // Un message de service n'est jamais un état : le confondre avec un
        // ShowState viderait l'écran de la salle.
        if ((recu as Service).__projecteur === "overlay-alive") {
          onOverlayAlive?.();
          return;
        }
        onState?.(recu as ShowState);
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
    sendAlive() {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(BATTEMENT));
      }
    },
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
      const open = socket;
      if (!open) return;
      // Fermer une liaison encore en cours d'établissement fait avertir le
      // navigateur. On attend l'ouverture pour refermer proprement : le cas se
      // produit à chaque montage double de StrictMode en développement.
      if (open.readyState === WebSocket.CONNECTING) {
        open.addEventListener("open", () => open.close(), { once: true });
      } else {
        open.close();
      }
    },
  };
}
