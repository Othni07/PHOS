import type { Platform } from "./types.ts";
import { webPlatform } from "./web.ts";

// Sélection à la construction, jamais à l'exécution — voir §5 du document de contexte.
// La phase 2 ajoutera tauri.ts et un aiguillage sur import.meta.env.VITE_PLATFORM.
export const platform: Platform = webPlatform;

export type { Platform, ScreenInfo } from "./types.ts";
