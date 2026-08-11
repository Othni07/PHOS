import { useEffect, useState } from "react";
import { Output } from "../shared/Output";
import "../shared/Output.css";
import { createShowBus, loadPersistedState } from "../shared/showBus";
import type { ShowState } from "../types";
import "./ProjectionPage.css";

// Ne calcule jamais son propre état — reçoit tout de la console (§4).
export function ProjectionPage() {
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

  return (
    <div className="projection">
      <Output state={state} />
    </div>
  );
}
