// Chargement du texte biblique. Isolé du reste du module : tout ce qui touche
// la plateforme vit ici, ce qui laisse la logique de consultation (bible.ts)
// purement calculatoire, donc testable sans navigateur.

import { platform } from "../platform/index.ts";
import type { BibleData } from "./bible.ts";

const cache = new Map<string, Promise<BibleData>>();

export function loadBible(versionId: string): Promise<BibleData> {
  let pending = cache.get(versionId);
  if (!pending) {
    pending = platform.loadData<BibleData>(`bible-${versionId}.json`);
    // Un échec ne doit pas empoisonner le cache : une seconde tentative
    // (réseau revenu, fichier déposé) doit pouvoir réussir.
    pending.catch(() => cache.delete(versionId));
    cache.set(versionId, pending);
  }
  return pending;
}
