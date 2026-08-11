import { useCallback, useEffect, useRef, useState } from "react";
import { platform } from "../platform";
import { Output } from "../shared/Output";
import "../shared/Output.css";
import { createShowBus, loadPersistedState } from "../shared/showBus";
import { items } from "../show";
import type { ShowState } from "../types";
import "./ConsolePage.css";

interface FlatSlide {
  itemIndex: number;
  slideIndex: number;
}

function flatten(): FlatSlide[] {
  const flat: FlatSlide[] = [];
  items.forEach((item, itemIndex) => {
    item.slides.forEach((_, slideIndex) => {
      flat.push({ itemIndex, slideIndex });
    });
  });
  return flat;
}

const flatSlides = flatten();

function findFlatIndex(itemIndex: number, slideIndex: number): number {
  const i = flatSlides.findIndex(
    (f) => f.itemIndex === itemIndex && f.slideIndex === slideIndex,
  );
  return i === -1 ? 0 : i;
}

export function ConsolePage() {
  const busRef = useRef(createShowBus());
  const [state, setState] = useState<ShowState>(() => loadPersistedState());

  // La console est la seule à écrire dans le canal (§4) — diffuse à chaque changement.
  useEffect(() => {
    busRef.current.postState(state);
  }, [state]);

  // Rejeu à l'ouverture : une fenêtre qui vient de s'ouvrir n'a rien reçu.
  useEffect(() => {
    const bus = busRef.current;
    return bus.onMessage((msg) => {
      if (msg.type === "hello") bus.postState(state);
    });
  }, [state]);

  useEffect(() => {
    const bus = busRef.current;
    return () => bus.close();
  }, []);

  const goTo = useCallback((itemIndex: number, slideIndex: number) => {
    const slide = items[itemIndex]?.slides[slideIndex];
    if (!slide) return;
    setState((s) => ({ ...s, slide, itemIndex, slideIndex }));
  }, []);

  const step = useCallback(
    (delta: number) => {
      const current = findFlatIndex(state.itemIndex, state.slideIndex);
      const next = flatSlides[current + delta];
      if (!next) return;
      goTo(next.itemIndex, next.slideIndex);
    },
    [state.itemIndex, state.slideIndex, goTo],
  );

  const toggleBlackout = useCallback(() => {
    setState((s) => ({ ...s, visible: !s.visible }));
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;

      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        toggleBlackout();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [step, toggleBlackout]);

  const isLive = state.visible && state.slide !== null;

  return (
    <div className="console">
      <aside className="console__rundown">
        <h1 className="console__title">Déroulé</h1>
        {items.map((item, itemIndex) => (
          <div key={item.id} className="rundown-item">
            <div className="rundown-item__label">{item.label}</div>
            <ul className="rundown-item__slides">
              {item.slides.map((slide, slideIndex) => {
                const active =
                  state.slide !== null &&
                  itemIndex === state.itemIndex &&
                  slideIndex === state.slideIndex;
                return (
                  <li key={slideIndex}>
                    <button
                      type="button"
                      className={`slide-button${active ? " slide-button--active" : ""}`}
                      onClick={() => goTo(itemIndex, slideIndex)}
                    >
                      {slide.reference}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </aside>

      <main className="console__main">
        <div className="preview">
          <div className={`tally-rail${isLive ? " tally-rail--live" : ""}`} />
          <div className="preview__screen">
            <Output state={state} />
          </div>
        </div>

        <div className="console__controls">
          <button type="button" className="control-button" onClick={toggleBlackout}>
            {state.visible ? "Écran noir (B)" : "Rétablir (B)"}
          </button>
          <button
            type="button"
            className="control-button"
            onClick={() => platform.openProjection()}
          >
            Projeter sur…
          </button>
          <div className="overlay-url">
            <span>URL overlay OBS</span>
            <code>{platform.overlayUrl()}</code>
          </div>
        </div>
      </main>
    </div>
  );
}
