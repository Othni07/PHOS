import { useEffect, useMemo, useRef, useState } from "react";
import { loadBible, lookup, versions } from "../bible/bible.ts";
import { parseReference } from "../bible/reference.ts";
import { searchSongs, songToItem } from "../songs/search.ts";
import { loadSongBook } from "../songs/songs.ts";
import type { SongBook } from "../songs/types";
import type { Item } from "../types";
import "./SearchBar.css";

interface SearchBarProps {
  onSubmit: (item: Item) => void;
}

interface Result {
  key: string;
  /** Pastille de provenance : « LSG », « nº 12 », « Cantique ». */
  badge: string;
  label: string;
  body: string;
  build: () => Item;
}

// Deux ajouts du même passage dans la même milliseconde doivent rester deux
// entrées distinctes du déroulé — un compteur y suffit et ne peut pas collisionner.
let sequence = 0;

function withFreshId(item: Item): Item {
  sequence += 1;
  return { ...item, id: `${item.id}-${sequence}` };
}

export function SearchBar({ onSubmit }: SearchBarProps) {
  const [versionId, setVersionId] = useState(versions[0].id);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const version = versions.find((v) => v.id === versionId) ?? versions[0];

  // Les données sont chargées une fois puis mises en cache. Le premier
  // chargement doit être terminé avant le culte, pas pendant.
  const [bible, setBible] = useState<Awaited<ReturnType<typeof loadBible>> | null>(null);
  const [bibleError, setBibleError] = useState<string | null>(null);
  const [songBook, setSongBook] = useState<SongBook | null>(null);
  const [songError, setSongError] = useState<string | null>(null);

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

  // Le recueil est indépendant de la version biblique : chargé une seule fois.
  useEffect(() => {
    let cancelled = false;
    loadSongBook().then(
      (loaded) => {
        if (!cancelled) setSongBook(loaded);
      },
      (error: unknown) => {
        if (cancelled) return;
        setSongError(
          error instanceof Error ? error.message : "Chargement du recueil impossible",
        );
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Résultats recalculés à chaque frappe : c'est le retour immédiat qui permet
  // de corriger une saisie avant de l'envoyer à l'écran.
  const { results, message } = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return { results: [] as Result[], message: null };

    const found: Result[] = [];
    let message: string | null = null;

    // La Bible passe devant : une référence valide est sans ambiguïté.
    const ref = parseReference(trimmed);
    if (ref && bible) {
      const result = lookup(bible, ref, version);
      if (result.ok) {
        const item = result.item;
        const count = item.slides.length;
        found.push({
          key: "bible",
          badge: version.abbrev,
          label: count > 1 ? `${item.label} · ${count} versets` : item.label,
          body: item.slides[0].body,
          build: () => withFreshId(item),
        });
      } else {
        message = result.message;
      }
    }

    if (songBook) {
      for (const song of searchSongs(songBook, trimmed)) {
        const item = songToItem(song);
        found.push({
          key: `song-${song.id}`,
          badge: song.number === undefined ? "Cantique" : `nº ${song.number}`,
          label: `${song.title} · ${item.slides.length} diapositives`,
          body: item.slides[0]?.body ?? "",
          build: () => withFreshId(item),
        });
      }
    }

    return { results: found, message };
  }, [bible, songBook, query, version]);

  // La sélection repart en tête dès que la liste change sous les doigts.
  useEffect(() => {
    setSelected(0);
  }, [query]);

  const active = results.length === 0 ? -1 : Math.min(selected, results.length - 1);

  function submit(index = active) {
    const result = results[index];
    if (!result) return;
    onSubmit(result.build());
    setQuery("");
  }

  // Barre oblique : ramène le curseur dans la recherche sans quitter le clavier.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (event.key === "/") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const loading = bible === null && bibleError === null;

  return (
    <div className="search">
      <div className="search__row">
        <input
          ref={inputRef}
          className="search__input"
          type="text"
          value={query}
          placeholder="jn 3:16 · Ps 23 · à toi la gloire · 4"
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelected((s) => Math.min(s + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelected((s) => Math.max(s - 1, 0));
            } else if (e.key === "Escape") {
              e.preventDefault();
              inputRef.current?.blur();
            }
          }}
        />
        <select
          className="search__version"
          value={versionId}
          onChange={(e) => setVersionId(e.target.value)}
          title="Version biblique"
        >
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.abbrev}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="search__hint">Chargement de {version.name}…</p>}
      {bibleError && <p className="search__hint search__hint--error">{bibleError}</p>}
      {songError && <p className="search__hint search__hint--error">{songError}</p>}

      {query.trim() !== "" && (
        <div className="search__result">
          {message && <p className="search__hint search__hint--error">{message}</p>}

          {results.map((result, index) => (
            <button
              key={result.key}
              type="button"
              className={`search__match${index === active ? " search__match--active" : ""}`}
              onClick={() => submit(index)}
              onMouseEnter={() => setSelected(index)}
            >
              <span className="search__match-label">
                <span className="search__match-badge">{result.badge}</span>
                {result.label}
              </span>
              <span className="search__match-body">{result.body}</span>
              {index === active && <span className="search__match-enter">Entrée</span>}
            </button>
          ))}

          {results.length === 0 && message === null && !loading && (
            <p className="search__hint">Aucune référence ni cantique trouvé.</p>
          )}
        </div>
      )}
    </div>
  );
}
