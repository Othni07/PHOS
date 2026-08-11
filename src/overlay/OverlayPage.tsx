import { useEffect, useState } from "react";
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

  const isOnAir = state.visible && state.slide !== null;

  return (
    <div className="overlay">
      <div className={`overlay__band${isOnAir ? " overlay__band--on" : ""}`}>
        {state.slide && (
          <>
            <p className="overlay__body">{state.slide.body}</p>
            <p className="overlay__reference">{state.slide.reference}</p>
          </>
        )}
      </div>
    </div>
  );
}
