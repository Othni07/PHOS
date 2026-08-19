import { useEffect, useState } from "react";
import { OverlayBand } from "../shared/OverlayBand.tsx";
import { connectRelay } from "../shared/relay.ts";
import { createShowBus, loadPersistedState, reviveShowState } from "../shared/showBus";
import type { ShowState } from "../types";
import "./OverlayPage.css";

// Incrustation OBS — fond transparent obligatoire, bandeau bas uniquement.
export function OverlayPage() {
  const [state, setState] = useState<ShowState>(() => loadPersistedState());

  useEffect(() => {
    const bus = createShowBus();
    const unsubscribe = bus.onMessage((msg) => {
      // L'état reçu est toujours normalisé : une console d'une version
      // antérieure, ou un message tronqué, ne doit pas faire planter la
      // sortie. La salle voit alors les réglages par défaut, pas un écran mort.
      if (msg.type === "state") setState(reviveShowState(msg.payload));
    });
    bus.postHello();
    return () => {
      unsubscribe();
      bus.close();
    };
  }, []);

  // Les deux canaux portent le même ShowState. Le BroadcastChannel sert quand
  // l'overlay est ouvert dans le navigateur de la régie ; le relais est le
  // seul qui atteigne le Chromium d'OBS. Écouter les deux évite d'avoir à
  // savoir où la page tourne.
  useEffect(() => {
    const relay = connectRelay((incoming) => setState(reviveShowState(incoming)));
    return () => relay.close();
  }, []);

  return (
    <div className="overlay-page">
      <OverlayBand state={state} />
    </div>
  );
}
