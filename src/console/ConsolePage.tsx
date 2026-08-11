import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { platform } from "../platform";
import { Output } from "../shared/Output";
import "../shared/Output.css";
import { createShowBus, loadPersistedState } from "../shared/showBus";
import { initialItems } from "../show";
import type { Item, ShowState } from "../types";
import { SearchBar } from "./SearchBar.tsx";
import "./ConsolePage.css";

interface FlatSlide {
  itemIndex: number;
  slideIndex: number;
}

function flatten(items: Item[]): FlatSlide[] {
  const flat: FlatSlide[] = [];
  items.forEach((item, itemIndex) => {
    item.slides.forEach((_, slideIndex) => {
      flat.push({ itemIndex, slideIndex });
    });
  });
  return flat;
}

export function ConsolePage() {
  const busRef = useRef<ReturnType<typeof createShowBus> | null>(null);
  const [items, setItems] = useState<Item[]>(() => initialItems);
  const [state, setState] = useState<ShowState>(() => loadPersistedState());

  const flatSlides = useMemo(() => flatten(items), [items]);

  // Créé et fermé dans le même effet pour rester cohérent sous StrictMode
  // (mount → cleanup → remount en dev fermerait un canal encore référencé
  // par les effets ci-dessous si la création se faisait ailleurs).
  useEffect(() => {
    const bus = createShowBus();
    busRef.current = bus;
    return () => {
      bus.close();
      busRef.current = null;
    };
  }, []);

  // La console est la seule à écrire dans le canal (§4) — diffuse à chaque changement.
  useEffect(() => {
    busRef.current?.postState(state);
  }, [state]);

  // Rejeu à l'ouverture : une fenêtre qui vient de s'ouvrir n'a rien reçu.
  useEffect(() => {
    const bus = busRef.current;
    if (!bus) return;
    return bus.onMessage((msg) => {
      if (msg.type === "hello") bus.postState(state);
    });
  }, [state]);

  const goTo = useCallback(
    (itemIndex: number, slideIndex: number) => {
      const slide = items[itemIndex]?.slides[slideIndex];
      if (!slide) return;
      setState((s) => ({ ...s, slide, itemIndex, slideIndex }));
    },
    [items],
  );

  const step = useCallback(
    (delta: number) => {
      const current = flatSlides.findIndex(
        (f) => f.itemIndex === state.itemIndex && f.slideIndex === state.slideIndex,
      );
      const next = flatSlides[(current === -1 ? 0 : current) + delta];
      if (!next) return;
      goTo(next.itemIndex, next.slideIndex);
    },
    [flatSlides, state.itemIndex, state.slideIndex, goTo],
  );

  const toggleBlackout = useCallback(() => {
    setState((s) => ({ ...s, visible: !s.visible }));
  }, []);

  // Un passage trouvé part directement à l'antenne : c'est le geste attendu
  // quand le prédicateur annonce une référence en pleine prédication.
  const addItem = useCallback((item: Item) => {
    setItems((previous) => {
      const itemIndex = previous.length;
      setState((s) => ({
        ...s,
        slide: item.slides[0],
        visible: true,
        itemIndex,
        slideIndex: 0,
      }));
      return [...previous, item];
    });
  }, []);

  const removeItem = useCallback((itemIndex: number) => {
    setItems((previous) => previous.filter((_, i) => i !== itemIndex));
    setState((s) =>
      s.itemIndex === itemIndex
        ? { ...s, slide: null, visible: false, itemIndex: 0, slideIndex: 0 }
        : s.itemIndex > itemIndex
          ? { ...s, itemIndex: s.itemIndex - 1 }
          : s,
    );
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

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
        <SearchBar onSubmit={addItem} />

        <h1 className="console__title">Déroulé</h1>
        {items.length === 0 && (
          <p className="console__empty">
            Tapez une référence ci-dessus pour ajouter un passage.
          </p>
        )}
        {items.map((item, itemIndex) => (
          <div key={item.id} className="rundown-item">
            <div className="rundown-item__header">
              <span className="rundown-item__label">{item.label}</span>
              <button
                type="button"
                className="rundown-item__remove"
                onClick={() => removeItem(itemIndex)}
                title="Retirer du déroulé"
                aria-label={`Retirer ${item.label}`}
              >
                ×
              </button>
            </div>
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
