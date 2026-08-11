import { useEffect, useRef, useState } from "react";
import { Output } from "../shared/Output";
import "../shared/Output.css";
import { createShowBus, loadPersistedState } from "../shared/showBus";
import type { ShowState } from "../types";
import "./ProjectionPage.css";

// Ne calcule jamais son propre état — reçoit tout de la console (§4).
export function ProjectionPage() {
  const busRef = useRef(createShowBus());
  const [state, setState] = useState<ShowState>(() => loadPersistedState());

  useEffect(() => {
    const bus = busRef.current;
    const unsubscribe = bus.onMessage((msg) => {
      if (msg.type === "state") setState(msg.payload);
    });
    bus.postHello();
    return unsubscribe;
  }, []);

  useEffect(() => {
    const bus = busRef.current;
    return () => bus.close();
  }, []);

  return (
    <div className="projection">
      <Output state={state} />
    </div>
  );
}
