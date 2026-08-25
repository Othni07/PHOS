// Chargement du texte biblique. Isolé du reste du module : tout ce qui touche
// la plateforme vit ici, ce qui laisse la logique de consultation (bible.ts)
// purement calculatoire, donc testable sans navigateur.

import { platform } from "../platform/index.ts";
import { catalogue, versions, type BibleData, type BibleVersion } from "./bible.ts";

const cache = new Map<string, Promise<BibleData>>();

function bibleExists(versionId: string): Promise<boolean> {
  return platform.hasData(`bible-${versionId}.json`);
}

/**
 * Ne garde du catalogue que les versions dont le fichier est réellement là.
 * Les traductions sous droits ne sont pas versionnées avec le code (§13) :
 * une installation fraîche ne doit donc pas les proposer, et une machine où
 * elles ont été converties doit les voir apparaître sans rien configurer.
 */
export async function versionsDisponibles(): Promise<BibleVersion[]> {
  const presentes = await Promise.all(
    catalogue.map(async (v) => ((await bibleExists(v.id)) ? v : null)),
  );
  const trouvees = presentes.filter((v) => v !== null);
  // Jamais de liste vide : sans la Segond, la régie n'aurait rien à chercher.
  return trouvees.length > 0 ? trouvees : versions;
}

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
