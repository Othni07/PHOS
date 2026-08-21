import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  labelForSlides,
  neighbourVerse,
  slideFromSource,
  versions,
  type BibleData,
} from "../bible/bible.ts";
import { loadBible } from "../bible/load.ts";
import { Output } from "../shared/Output";
import "../shared/Output.css";
import type { OverlayAppearance } from "../shared/appearance.ts";
import type { ProjectionBackground, Ticker } from "../shared/settings.ts";
import { connectRelay, type Relay } from "../shared/relay.ts";
import { createShowBus, loadPersistedState } from "../shared/showBus";
import type { Item, ShowState, SlideKind } from "../types";
import { AppearancePanel } from "./AppearancePanel.tsx";
import { BibleBrowser } from "./BibleBrowser.tsx";
import { ScreenPicker } from "./ScreenPicker.tsx";
import { SearchBar } from "./SearchBar.tsx";
import { SongEditor } from "./SongEditor.tsx";
import { loadSession, saveSession } from "./session.ts";
import { loadSongBook } from "../songs/songs.ts";
import type { Song, SongBook } from "../songs/types";
import { loadUserSongs, mergeSongBook, saveUserSongs } from "../songs/userSongs.ts";
import "./ConsolePage.css";

interface FlatSlide {
  itemIndex: number;
  slideIndex: number;
  kind: SlideKind;
}

type TabId = "bible" | "cantiques" | "parametres";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "bible", label: "Bible" },
  { id: "cantiques", label: "Cantiques" },
  { id: "parametres", label: "Paramètres" },
];

function flatten(items: Item[]): FlatSlide[] {
  const flat: FlatSlide[] = [];
  items.forEach((item, itemIndex) => {
    item.slides.forEach((_, slideIndex) => {
      flat.push({ itemIndex, slideIndex, kind: item.kind });
    });
  });
  return flat;
}

export function ConsolePage() {
  const busRef = useRef<ReturnType<typeof createShowBus> | null>(null);
  const relayRef = useRef<Relay | null>(null);
  // Le déroulé part vide à chaque nouvelle session, mais se retrouve intact
  // après un rechargement accidentel de la console (voir session.ts).
  const restored = useRef(loadSession()).current;
  const [items, setItems] = useState<Item[]>(restored?.items ?? []);
  const [state, setState] = useState<ShowState>(() => ({
    ...loadPersistedState(),
    slide: restored?.slide ?? null,
    visible: restored?.visible ?? false,
    itemIndex: restored?.itemIndex ?? 0,
    slideIndex: restored?.slideIndex ?? 0,
  }));
  // Trois onglets plutôt que des panneaux qui s'ouvrent et se ferment : les
  // outils occupent une place fixe, et l'opérateur sait toujours où regarder.
  const [tab, setTab] = useState<TabId>("bible");

  const [bundledSongs, setBundledSongs] = useState<SongBook | null>(null);
  const [songError, setSongError] = useState<string | null>(null);
  const [userSongs, setUserSongs] = useState<Song[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadSongBook().then(
      (loaded) => {
        if (!cancelled) setBundledSongs(loaded);
      },
      (error: unknown) => {
        if (cancelled) return;
        setSongError(
          error instanceof Error ? error.message : "Chargement du recueil impossible",
        );
      },
    );
    void loadUserSongs().then((songs) => {
      if (!cancelled) setUserSongs(songs);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const songBook = useMemo(
    () => mergeSongBook(bundledSongs, userSongs),
    [bundledSongs, userSongs],
  );

  const updateUserSongs = useCallback((songs: Song[]) => {
    setUserSongs(songs);
    void saveUserSongs(songs);
  }, []);

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

  /**
   * Les flèches ne franchissent pas la frontière entre versets et cantiques :
   * enchaîner sur la strophe 1 d'un chant parce qu'on lisait la fin d'un
   * passage serait une mauvaise surprise en direct. Chaque nature forme son
   * propre couloir de défilement.
   */
  const currentKind = items[state.itemIndex]?.kind;
  const lane = useMemo(
    () => (currentKind ? flatSlides.filter((f) => f.kind === currentKind) : flatSlides),
    [flatSlides, currentKind],
  );

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

  // Le déroulé est sauvegardé avec la position : après un rechargement, la
  // régie doit revenir exactement où elle en était, pas seulement afficher la
  // bonne diapositive au-dessus d'une liste vide.
  useEffect(() => {
    saveSession({
      items,
      slide: state.slide,
      visible: state.visible,
      itemIndex: state.itemIndex,
      slideIndex: state.slideIndex,
    });
  }, [items, state.slide, state.visible, state.itemIndex, state.slideIndex]);

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
      const current = lane.findIndex(
        (f) => f.itemIndex === state.itemIndex && f.slideIndex === state.slideIndex,
      );
      const next = lane[(current === -1 ? 0 : current) + delta];
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
    [lane, state.itemIndex, state.slideIndex, state.slide, goTo, bible, version],
  );

  const toggleBlackout = useCallback(() => {
    setState((s) => ({ ...s, visible: !s.visible }));
  }, []);

  const setAppearance = useCallback((appearance: OverlayAppearance) => {
    setState((s) => ({ ...s, appearance }));
  }, []);

  const setBackground = useCallback((background: ProjectionBackground) => {
    setState((s) => ({ ...s, background }));
  }, []);

  const setTicker = useCallback((ticker: Ticker) => {
    setState((s) => ({ ...s, ticker }));
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
      // La cible d'un événement clavier n'est pas toujours un élément : une
      // exception ici tuerait le défilement pour le reste du culte.
      const target = e.target instanceof Element ? e.target : null;
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

  // Ce qui viendra à la prochaine flèche — jamais diffusé, la console seule
  // l'affiche. Calculé comme le fait step() : d'abord le déroulé, puis la
  // suite du texte, sinon rien.
  const nextSlide = useMemo(() => {
    const current = lane.findIndex(
      (f) => f.itemIndex === state.itemIndex && f.slideIndex === state.slideIndex,
    );
    const following = lane[(current === -1 ? 0 : current) + 1];
    if (following) {
      return items[following.itemIndex]?.slides[following.slideIndex] ?? null;
    }
    const source = state.slide?.source;
    if (!bible || !source) return null;
    const target = neighbourVerse(bible, source, 1);
    return target ? slideFromSource(bible, target, version) : null;
  }, [lane, items, state.itemIndex, state.slideIndex, state.slide, bible, version]);

  return (
    <div className="console">
      {/* Barre de tête : la recherche reste le geste le plus fréquent (§11),
          elle occupe donc la première ligne sur toute la largeur. */}
      <header className="console__top">
        <div className="brand">
          <span className={`brand__dot${isLive ? " brand__dot--live" : ""}`} />
          <span className="brand__name">Projecteur</span>
          <span className="brand__state">{isLive ? "À l'antenne" : "Écran noir"}</span>
        </div>
        <SearchBar
          onSubmit={addItem}
          versionId={versionId}
          onVersionChange={setVersionId}
          bible={bible}
          bibleError={bibleError}
          songBook={songBook}
          songError={songError}
        />
      </header>

      <div className="console__body">
        <aside className="rundown">
          <h2 className="rundown__title">Déroulé</h2>
          {items.length === 0 && (
            <p className="rundown__empty">
              Tapez une référence ou un titre de cantique ci-dessus.
            </p>
          )}

          {/* Deux sections distinctes : les flèches restant dans une seule
              nature, la liste doit montrer où passe le défilement. */}
          {(["verset", "cantique"] as const).map((kind) => {
            const group = items
              .map((item, itemIndex) => ({ item, itemIndex }))
              .filter(({ item }) => item.kind === kind);
            if (group.length === 0) return null;

            return (
              <section key={kind} className={`rundown-group rundown-group--${kind}`}>
                <h3 className="rundown-group__title">
                  {kind === "verset" ? "Versets" : "Cantiques"}
                </h3>
                {group.map(({ item, itemIndex }) => (
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
              </section>
            );
          })}
        </aside>

        <main className="work">
          <div className="screens">
            <div className="screen screen--live">
              <div className="screen__label">
                <span className={`screen__dot${isLive ? " screen__dot--live" : ""}`} />
                À l'antenne
              </div>
              <div className="screen__frame">
                <div className={`tally-rail${isLive ? " tally-rail--live" : ""}`} />
                <div className="screen__glass">
                  <Output state={state} />
                </div>
              </div>
            </div>

            {/* Écran de contrôle : montre la diapositive suivante sans jamais
                la diffuser. Aucun message n'est posté depuis ici. */}
            <div className="screen screen--next">
              <div className="screen__label">
                Suivant
                {nextSlide && (
                  <span className="screen__next-ref">{nextSlide.reference}</span>
                )}
              </div>
              <div className="screen__frame">
                <div className="tally-rail" />
                <div className="screen__glass">
                  {nextSlide ? (
                    <Output state={{ ...state, slide: nextSlide, visible: true }} />
                  ) : (
                    <p className="screen__empty">Fin du déroulé</p>
                  )}
                </div>
              </div>
            </div>

            <div className="commands">
              <button
                type="button"
                className={`command${state.visible ? "" : " command--armed"}`}
                onClick={toggleBlackout}
              >
                {state.visible ? "Écran noir" : "Rétablir"}
                <kbd>B</kbd>
              </button>
              <ScreenPicker />
            </div>
          </div>

          <section className="tabs">
            <div className="tabs__bar" role="tablist">
              {TABS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === entry.id}
                  className={`tab${tab === entry.id ? " tab--on" : ""}`}
                  onClick={() => setTab(entry.id)}
                >
                  {entry.label}
                </button>
              ))}
            </div>

            <div className="tabs__panel" role="tabpanel">
              {tab === "bible" && (
                <BibleBrowser data={bible} version={version} onSubmit={addItem} />
              )}
              {tab === "cantiques" && (
                <SongEditor songs={userSongs} onSave={updateUserSongs} />
              )}
              {tab === "parametres" && (
                <AppearancePanel
                  state={state}
                  onChange={setAppearance}
                  onBackground={setBackground}
                  onTicker={setTicker}
                />
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
