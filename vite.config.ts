import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { obsRelay } from "./scripts/obs-relay.ts";

// Les trois routes (§4) sont servies comme pages distinctes plutôt que par un
// routeur client : /projection a besoin d'un <head> à elle pour son filet de
// sécurité (§7), qui doit s'appliquer avant que React ne démarre.
function cleanUrls(): Plugin {
  const map: Record<string, string> = {
    "/console": "/index.html",
    "/projection": "/projection.html",
    "/overlay": "/overlay.html",
  };
  return {
    name: "clean-urls",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url && map[req.url]) {
          req.url = map[req.url];
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), cleanUrls(), obsRelay()],
  server: {
    // Port figé : l'URL de l'overlay est saisie une fois dans OBS et ne doit
    // pas changer. Sans strictPort, Vite bascule silencieusement sur 5174
    // quand 5173 est pris, et la source OBS pointe alors dans le vide.
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        console: resolve(import.meta.dirname, "index.html"),
        projection: resolve(import.meta.dirname, "projection.html"),
        overlay: resolve(import.meta.dirname, "overlay.html"),
      },
    },
  },
});
