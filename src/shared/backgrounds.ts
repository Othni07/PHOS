/**
 * Images de fond de la projection en salle.
 *
 * En phase 1 l'application n'a pas accès au disque (§2) : les images vivent
 * dans le stockage du navigateur. Une photo de téléphone y tiendrait mal —
 * plusieurs mégaoctets, quand le quota tourne autour de cinq. Chaque image est
 * donc redimensionnée et recompressée à l'import, ce qui suffit largement pour
 * un vidéoprojecteur.
 *
 * La fenêtre de projection lit ces images directement, sans passer par le
 * canal d'état : envoyer une image entière à chaque changement de verset
 * serait absurde. Seul son identifiant voyage.
 */

import { platform } from "../platform";

const KEY = "backgrounds";
const MAX_WIDTH = 1920;
const QUALITY = 0.82;
/** Marge de sécurité sous le quota habituel de 5 Mo. */
export const STORE_LIMIT = 3_500_000;

export interface BackgroundImage {
  id: string;
  name: string;
  /** Image encodée en JPEG, prête à poser en CSS. */
  dataUrl: string;
}

export async function loadBackgrounds(): Promise<BackgroundImage[]> {
  const stored = await platform.store.get<BackgroundImage[]>(KEY);
  return Array.isArray(stored) ? stored : [];
}

export async function saveBackgrounds(images: BackgroundImage[]): Promise<void> {
  await platform.store.set(KEY, images);
}

export function totalSize(images: BackgroundImage[]): number {
  return images.reduce((n, image) => n + image.dataUrl.length, 0);
}

/** Redimensionne, recompresse, et renvoie l'image prête à stocker. */
export function prepareImage(file: File): Promise<BackgroundImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(1, MAX_WIDTH / img.naturalWidth);
      const width = Math.round(img.naturalWidth * ratio);
      const height = Math.round(img.naturalHeight * ratio);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Impossible de préparer l'image."));
        return;
      }
      context.drawImage(img, 0, 0, width, height);

      resolve({
        id: `fond-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name.replace(/\.[^.]+$/, "").slice(0, 40) || "Image",
        dataUrl: canvas.toDataURL("image/jpeg", QUALITY),
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Ce fichier n'est pas une image lisible."));
    };

    img.src = url;
  });
}
