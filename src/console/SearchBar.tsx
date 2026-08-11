import { useEffect, useMemo, useRef, useState } from "react";
import { loadBible, lookup, versions } from "../bible/bible.ts";
import { parseReference } from "../bible/reference.ts";
import type { Item } from "../types";
import "./SearchBar.css";

interface SearchBarProps {
  onSubmit: (item: Item) => void;
}

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready" };

export function SearchBar({ onSubmit }: SearchBarProps) {
  const [versionId, setVersionId] = useState(versions[0].id);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const inputRef = useRef<HTMLInputElement>(null);

  const version = versions.find((v) => v.id === versionId) ?? versions[0];

  // La Bible est chargée une fois par version puis mise en cache. Le premier
  // chargement doit être terminé avant le culte, pas pendant.
  const [data, setData] = useState<Awaited<ReturnType<typeof loadBible>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus({ kind: "loading" });
    setData(null);
    loadBible(versionId).then(
      (loaded) => {
        if (cancelled) return;
        setData(loaded);
        setStatus({ kind: "ready" });
      },
      (error: unknown) => {
        if (cancelled) return;
        setStatus({
          kind: "error",
          message: error instanceof Error ? error.message : "Chargement impossible",
        });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [versionId]);

  // Aperçu recalculé à chaque frappe : c'est le retour immédiat qui permet de
  // corriger une référence avant de l'envoyer à l'écran.
  const preview = useMemo(() => {
    if (!data) return null;
    const ref = parseReference(query);
    if (!ref) return null;
    return lookup(data, ref, version);
  }, [data, query, version]);

  function submit() {
    if (preview?.ok) {
      onSubmit(preview.item);
      setQuery("");
    }
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

  return (
    <div className="search">
      <div className="search__row">
        <input
          ref={inputRef}
          className="search__input"
          type="text"
          value={query}
          placeholder="jn 3:16 · Ps 23 · 1 co 13:4-7"
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
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

      {status.kind === "loading" && (
        <p className="search__hint">Chargement de {version.name}…</p>
      )}
      {status.kind === "error" && (
        <p className="search__hint search__hint--error">{status.message}</p>
      )}
      {status.kind === "ready" && query.trim() !== "" && (
        <div className="search__result">
          {preview === null && (
            <p className="search__hint">Référence non reconnue.</p>
          )}
          {preview?.ok === false && (
            <p className="search__hint search__hint--error">{preview.message}</p>
          )}
          {preview?.ok && (
            <button type="button" className="search__match" onClick={submit}>
              <span className="search__match-label">
                {preview.item.label}
                {preview.item.slides.length > 1 &&
                  ` · ${preview.item.slides.length} versets`}
              </span>
              <span className="search__match-body">{preview.item.slides[0].body}</span>
              <span className="search__match-enter">Entrée</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
