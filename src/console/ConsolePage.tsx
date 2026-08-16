import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  labelForSlides,
  neighbourVerse,
  slideFromSource,
  versions,
  type BibleData,
} from "../bible/bible.ts";
import { loadBible } from "../bible/load.ts";
import { platform } from "../platform";
import { Output } from "../shared/Output";
import "../shared/Output.css";
import { connectRelay, type Relay } from "../shared/relay.ts";
import { createShowBus, loadPersistedState } from "../shared/showBus";
import type { Item, ShowState } from "../types";
import { BibleBrowser } from "./BibleBrowser.tsx";
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
  const relayRef = useRef<Relay | null>(null);
  // Le déroulé part vide : tout entre par la recherche, versets comme cantiques.
  const [items, setItems] = useState<Item[]>([]);
  const [state, setState] = useState<ShowState>(() => loadPersistedState());
  const [browsing, setBrowsing] = useState(false);

  // La version courante et le texte chargé appartiennent à la console : la
  // recherche et le navigateur de livres doivent désigner le même texte.
  const [versionId, setVersionId] = useState(versions[0].id);
  const [bible, setBible] = useState<BibleData | null>(null);
  const [bibleError, setBibleError] = useState<string | null>(null);
  const version = versions.find((v) => v.id === versionId) ?? versions[0];

  useEffect(() => {
    let cancelled = false;
    setBible(null);
    setBibleError(null);
    loadBible(versionId).then(
      (loaded) => {
        if (!cancelled) setBible(loaded);
      },
      (error: unknown) => {
        if (cancelled) return;
        setBibleError(
          error instanceof Error ? error.message : "Chargement de la Bible impossible",
        );
      },
    );
    return () => {
      cancelled = true;
    };
  }, [versionId]);

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

  // Second canal, vers la source Navigateur d'OBS : elle tourne dans un
  // Chromium distinct et ne reçoit pas le BroadcastChannel.
  useEffect(() => {
    const relay = connectRelay(null);
    relayRef.current = relay;
    return () => {
      relay.close();
      relayRef.current = null;
    };
  }, []);

  // La console est la seule à écrire dans le canal (§4) — diffuse à chaque changement.
  useEffect(() => {
    busRef.current?.postState(state);
    relayRef.current?.send(state);
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
    (delta: 1 | -1) => {
      const current = flatSlides.findIndex(
        (f) => f.itemIndex === state.itemIndex && f.slideIndex === state.slideIndex,
      );
      const next = flatSlides[(current === -1 ? 0 : current) + delta];
      if (next) {
        goTo(next.itemIndex, next.slideIndex);
        return;
      }

      // Rien de préparé au-delà : si l'on est sur un verset, la lecture se
      // poursuit dans le texte. Projeter Jean 1.1 puis lire la suite à la
      // flèche est le geste attendu, sans repasser par la recherche.
      const source = state.slide?.source;
      if (!bible || !source) return;
      const target = neighbourVerse(bible, source, delta);
      if (!target) return;
      const slide = slideFromSource(bible, target, version);
      if (!slide) return;

      // La diapositive rejoint le passage courant, qui s'étend : le déroulé
      // garde ainsi la trace de ce qui a réellement été lu.
      setItems((previous) =>
        previous.map((item, i) => {
          if (i !== state.itemIndex) return item;
          const slides =
            delta === 1 ? [...item.slides, slide] : [slide, ...item.slides];
          return { ...item, slides, label: labelForSlides(slides, item.label) };
        }),
      );
      setState((s) => ({
        ...s,
        slide,
        slideIndex: delta === 1 ? s.slideIndex + 1 : 0,
      }));
    },
    [flatSlides, state.itemIndex, state.slideIndex, state.slide, goTo, bible, version],
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
      // Dans le navigateur de livres, les flèches servent à parcourir les
      // grilles : elles ne doivent pas faire défiler ce qui est à l'antenne.
      if (target?.closest("[data-browser]")) return;

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

  // Ce qui viendra à la prochaine flèche — jamais diffusé, la console seule
  // l'affiche. Calculé comme le fait step() : d'abord le déroulé, puis la
  // suite du texte, sinon rien.
  const nextSlide = useMemo(() => {
    const current = flatSlides.findIndex(
      (f) => f.itemIndex === state.itemIndex && f.slideIndex === state.slideIndex,
    );
    const following = flatSlides[(current === -1 ? 0 : current) + 1];
    if (following) {
      return items[following.itemIndex]?.slides[following.slideIndex] ?? null;
    }
    const source = state.slide?.source;
    if (!bible || !source) return null;
    const target = neighbourVerse(bible, source, 1);
    return target ? slideFromSource(bible, target, version) : null;
  }, [flatSlides, items, state.itemIndex, state.slideIndex, state.slide, bible, version]);

  return (
    <div className={`console${browsing ? " console--browsing" : ""}`}>
      <aside className="console__rundown">
        <SearchBar
          onSubmit={addItem}
          versionId={versionId}
          onVersionChange={setVersionId}
          bible={bible}
          bibleError={bibleError}
        />

        <h1 className="console__title">Déroulé</h1>
        {items.length === 0 && (
          <p className="console__empty">
            Tapez une référence ou un titre de cantique ci-dessus.
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

      {browsing && (
        <BibleBrowser
          data={bible}
          version={version}
          onSubmit={addItem}
          onClose={() => setBrowsing(false)}
        />
      )}

      <main className="console__main">
        <div className="screens">
          <div className="screen">
            <div className="screen__label">
              <span className={`screen__dot${isLive ? " screen__dot--live" : ""}`} />
              À l'antenne
            </div>
            <div className="preview">
              <div className={`tally-rail${isLive ? " tally-rail--live" : ""}`} />
              <div className="preview__screen">
                <Output state={state} />
              </div>
            </div>
          </div>

          {/* Écran de contrôle : montre la diapositive suivante sans jamais la
              diffuser. Aucun message n'est posté depuis ici. */}
          <div className="screen screen--next">
            <div className="screen__label">Suivant</div>
            <div className="preview">
              <div className="tally-rail" />
              <div className="preview__screen">
                {nextSlide ? (
                  <Output
                    state={{
                      slide: nextSlide,
                      visible: true,
                      itemIndex: 0,
                      slideIndex: 0,
                    }}
                  />
                ) : (
                  <p className="screen__empty">Fin du déroulé</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="console__controls">
          <button type="button" className="control-button" onClick={toggleBlackout}>
            {state.visible ? "Écran noir (B)" : "Rétablir (B)"}
          </button>
          <button
            type="button"
            className={`control-button${browsing ? " control-button--on" : ""}`}
            onClick={() => setBrowsing((open) => !open)}
          >
            Parcourir la Bible
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
