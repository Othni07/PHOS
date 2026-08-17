import { useEffect, useState } from "react";
import { OverlayBand } from "../shared/OverlayBand.tsx";
import { connectRelay } from "../shared/relay.ts";
import { createShowBus, loadPersistedState } from "../shared/showBus";
import type { ShowState } from "../types";
import "./OverlayPage.css";

// Incrustation OBS — fond transparent obligatoire, bandeau bas uniquement.
export function OverlayPage() {
  const [state, setState] = useState<ShowState>(() => loadPersistedState());

  useEffect(() => {
    const bus = createShowBus();
    const unsubscribe = bus.onMessage((msg) => {
      if (msg.type === "state") setState(msg.payload);
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
    const relay = connectRelay(setState);
    return () => relay.close();
  }, []);

  return (
    <div className="overlay-page">
      <OverlayBand state={state} />
    </div>
  );
}
