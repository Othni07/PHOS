import type { Plugin } from "vite";
import { WebSocketServer, type WebSocket } from "ws";

/**
 * Relais d'état pour la source Navigateur d'OBS.
 *
 * La console diffuse par BroadcastChannel, qui ne relie que des onglets d'une
 * même instance de navigateur. Or OBS embarque son propre Chromium : son
 * canal est distinct de celui de Chrome et ne reçoit rien. Sans ce relais,
 * l'overlay OBS reste transparent et vide indéfiniment.
 *
 * Le serveur mémorise le dernier état et le rejoue à chaque nouveau client :
 * OBS qui se connecte en plein culte doit retrouver l'affichage sans qu'on
 * touche à la régie — même exigence que le rejeu « hello » du §4, et même
 * comportement que le serveur axum prévu au §9 pour la phase 2.
 */
export const RELAY_PATH = "/obs";

export function obsRelay(): Plugin {
  return {
    name: "obs-relay",
    configureServer(server) {
      const wss = new WebSocketServer({ noServer: true });
      let last: string | null = null;

      // Vite utilise déjà « upgrade » pour son HMR : on ne prend la main que
      // sur notre chemin et on laisse passer le reste.
      server.httpServer?.on("upgrade", (request, socket, head) => {
        if (!request.url?.startsWith(RELAY_PATH)) return;
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      });

      wss.on("connection", (ws: WebSocket) => {
        if (last !== null) ws.send(last);

        ws.on("message", (data) => {
          last = data.toString();
          for (const client of wss.clients) {
            // Ne pas renvoyer à l'émetteur : la console est déjà à jour, et
            // l'écho la ferait boucler sur son propre état.
            if (client !== ws && client.readyState === client.OPEN) {
              client.send(last);
            }
          }
        });
      });

      server.httpServer?.on("close", () => wss.close());
    },
  };
}
