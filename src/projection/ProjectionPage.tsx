import { useEffect, useState } from "react";
import { Output } from "../shared/Output";
import "../shared/Output.css";
import { createShowBus, loadPersistedState } from "../shared/showBus";
import type { ShowState } from "../types";
import "./ProjectionPage.css";

// Ne calcule jamais son propre état — reçoit tout de la console (§4).
export function ProjectionPage() {
  const [state, setState] = useState<ShowState>(() => loadPersistedState());

  // Ouverte sur un écran désigné, la page réclame le plein écran elle-même :
  // la fenêtre parente ne peut pas l'exiger faute d'interaction dans celle-ci.
  // Un refus n'est pas grave — la fenêtre couvre déjà l'écran et F11 reste
  // disponible ; c'est la barre d'adresse en moins, pas la projection.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("plein-ecran") !== "1") return;
    void document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

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

  return (
    <div className="projection">
      <Output state={state} />
    </div>
  );
}
