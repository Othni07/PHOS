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

  let features = "popup";
  if (screenId !== undefined && typeof window.getScreenDetails === "function") {
    try {
      const details = await window.getScreenDetails();
      const screen = details.screens[Number(screenId)];
      if (screen) {
        features = `popup,left=${screen.left},top=${screen.top},width=${screen.width},height=${screen.height}`;
      }
    } catch {
      // Retombe sur l'ouverture manuelle
    }
  }

  projectionWindow = window.open("/projection", "projection", features);

  if (screenId !== undefined && projectionWindow) {
    projectionWindow.addEventListener("load", () => {
      projectionWindow?.moveTo(0, 0);
      projectionWindow?.document.documentElement.requestFullscreen?.().catch(() => {});
    });
  }
}

async function closeProjection(): Promise<void> {
  projectionWindow?.close();
  projectionWindow = null;
}

function overlayUrl(): string {
  return `${window.location.origin}/overlay`;
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
  store,
};
