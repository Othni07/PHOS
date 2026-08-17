import type { Platform, ScreenInfo } from "./types";

let projectionWindow: Window | null = null;

declare global {
  interface Window {
    getScreenDetails?: () => Promise<{
      screens: Array<{
        left: number;
        top: number;
        width: number;
        height: number;
        isPrimary: boolean;
        label: string;
      }>;
    }>;
  }
}

async function listScreens(): Promise<ScreenInfo[]> {
  if (typeof window.getScreenDetails !== "function") return [];
  try {
    const details = await window.getScreenDetails();
    return details.screens.map((s, i) => ({
      id: String(i),
      label: s.label || `Écran ${i + 1}`,
      width: s.width,
      height: s.height,
      isPrimary: s.isPrimary,
    }));
  } catch {
    return [];
  }
}

async function openProjection(screenId?: string): Promise<void> {
  if (projectionWindow && !projectionWindow.closed) {
    projectionWindow.focus();
    return;
  }

  // Sans écran désigné, on ouvre une fenêtre que l'opérateur glissera lui-même
  // sur le vidéoprojecteur avant d'appuyer sur F11 (mécanisme 1 du §4).
  let features = "popup,width=1280,height=720";
  let url = "/projection";

  if (screenId !== undefined && typeof window.getScreenDetails === "function") {
    try {
      const details = await window.getScreenDetails();
      const screen = details.screens[Number(screenId)];
      if (screen) {
        // Les coordonnées sont celles du bureau étendu : la fenêtre naît
        // directement sur le bon écran, à ses dimensions exactes.
        features = `popup,left=${screen.left},top=${screen.top},width=${screen.width},height=${screen.height}`;
        // Le plein écran est demandé par la page elle-même : l'exiger depuis
        // la fenêtre parente est refusé faute d'interaction dans la fille.
        url = "/projection?plein-ecran=1";
      }
    } catch {
      // Permission refusée : on retombe sur l'ouverture manuelle.
    }
  }

  projectionWindow = window.open(url, "projection", features);
}

async function closeProjection(): Promise<void> {
  projectionWindow?.close();
  projectionWindow = null;
}

function overlayUrl(): string {
  return `${window.location.origin}/overlay`;
}

async function loadData<T>(name: string): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/${name}`);
  if (!response.ok) {
    throw new Error(`Données introuvables : ${name} (HTTP ${response.status})`);
  }
  return (await response.json()) as T;
}

const store: Platform["store"] = {
  async get<T>(key: string): Promise<T | null> {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async set<T>(key: string, value: T): Promise<void> {
    window.localStorage.setItem(key, JSON.stringify(value));
  },
};

export const webPlatform: Platform = {
  listScreens,
  openProjection,
  closeProjection,
  overlayUrl,
  loadData,
  store,
};
