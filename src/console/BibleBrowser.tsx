import { useEffect, useMemo, useRef, useState } from "react";
import { buildSelection, formatVerseList, type BibleData, type GroupMode } from "../bible/bible.ts";
import { books, type BookInfo } from "../bible/books.ts";
import type { BibleVersion } from "../bible/bible.ts";
import type { Item } from "../types";
import "./BibleBrowser.css";

interface BibleBrowserProps {
  data: BibleData | null;
  version: BibleVersion;
  onSubmit: (item: Item) => void;
  onClose: () => void;
}

/**
 * Parcours livre → chapitre → versets, pour l'opérateur qui ne connaît pas la
 * référence par cœur. Complète la recherche, ne la remplace pas : taper
 * « jn 3:16 » reste plus rapide quand on sait ce qu'on cherche.
 */
export function BibleBrowser({ data, version, onSubmit, onClose }: BibleBrowserProps) {
  const [book, setBook] = useState<BookInfo | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const [selection, setSelection] = useState<number[]>([]);
  const [mode, setMode] = useState<GroupMode>("separate");
  // Ancre du Maj+clic : dernier verset cliqué sans modificateur.
  const anchorRef = useRef<number | null>(null);

  const chapters = book && data ? data.books[book.id] : undefined;
  const verses = chapters && chapter ? chapters[chapter - 1] : undefined;

  // Changer de livre ou de chapitre invalide la sélection : garder des numéros
  // qui désignent un autre texte serait pire que de repartir de zéro.
  useEffect(() => {
    setChapter(null);
    setSelection([]);
    anchorRef.current = null;
  }, [book]);

  useEffect(() => {
    setSelection([]);
    anchorRef.current = null;
  }, [chapter]);

  const grouped = useMemo(
    () => ({
      AT: books.filter((b) => b.testament === "AT"),
      NT: books.filter((b) => b.testament === "NT"),
    }),
    [],
  );

  function toggleVerse(n: number, extend: boolean) {
    setSelection((current) => {
      if (extend && anchorRef.current !== null) {
        const from = Math.min(anchorRef.current, n);
        const to = Math.max(anchorRef.current, n);
        const range = [];
        for (let i = from; i <= to; i += 1) range.push(i);
        return [...new Set([...current, ...range])];
      }
      anchorRef.current = n;
      return current.includes(n) ? current.filter((v) => v !== n) : [...current, n];
    });
  }

  function selectAll() {
    if (!verses) return;
    setSelection(verses.map((_, i) => i + 1));
    anchorRef.current = null;
  }

  function submit() {
    if (!data || !book || !chapter) return;
    const item = buildSelection(data, book, chapter, selection, version, mode);
    if (!item) return;
    onSubmit(item);
    // Le passage est parti : on repart d'une sélection vide, sinon le clic
    // suivant décoche un verset au lieu d'en choisir un nouveau.
    setSelection([]);
    anchorRef.current = null;
  }

  const summary =
    book && chapter && selection.length > 0
      ? `${book.refName ?? book.name} ${chapter}.${formatVerseList(selection)}`
      : null;

  return (
    <section className="browser" data-browser aria-label="Parcourir la Bible">
      <div className="browser__head">
        <h2 className="browser__title">Parcourir</h2>
        <button type="button" className="browser__close" onClick={onClose} title="Fermer">
          ×
        </button>
      </div>

      {!data && <p className="browser__hint">Chargement de {version.name}…</p>}

      {data && (
        <div className="browser__cols">
          <div className="browser__col browser__col--books">
            {(["AT", "NT"] as const).map((testament) => (
              <div key={testament}>
                <h3 className="browser__group">
                  {testament === "AT" ? "Ancien Testament" : "Nouveau Testament"}
                </h3>
                <ul className="browser__list">
                  {grouped[testament].map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        className={`browser__book${b.id === book?.id ? " browser__book--active" : ""}`}
                        onClick={() => setBook(b)}
                      >
                        {b.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="browser__col">
            <h3 className="browser__group">Chapitre</h3>
            {!book && <p className="browser__hint">Choisissez un livre.</p>}
            {chapters && (
              <div className="browser__grid">
                {chapters.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`browser__num${i + 1 === chapter ? " browser__num--active" : ""}`}
                    onClick={() => setChapter(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="browser__col">
            <h3 className="browser__group">Versets</h3>
            {!chapter && <p className="browser__hint">Choisissez un chapitre.</p>}
            {verses && (
              <>
                <div className="browser__grid">
                  {verses.map((_, i) => {
                    const n = i + 1;
                    return (
                      <button
                        key={n}
                        type="button"
                        className={`browser__num${selection.includes(n) ? " browser__num--picked" : ""}`}
                        onClick={(e) => toggleVerse(n, e.shiftKey)}
                        title={verses[i]}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <p className="browser__tip">Maj+clic pour une suite.</p>
              </>
            )}
          </div>
        </div>
      )}

      {verses && (
        <div className="browser__foot">
          <div className="browser__actions">
            <button type="button" className="browser__action" onClick={selectAll}>
              Tout le chapitre
            </button>
            <button
              type="button"
              className="browser__action"
              onClick={() => setSelection([])}
              disabled={selection.length === 0}
            >
              Effacer
            </button>
            <label className="browser__mode">
              <input
                type="checkbox"
                checked={mode === "grouped"}
                onChange={(e) => setMode(e.target.checked ? "grouped" : "separate")}
              />
              Réunir sur une diapositive
            </label>
          </div>

          <button
            type="button"
            className="browser__submit"
            onClick={submit}
            disabled={selection.length === 0}
          >
            {summary ? `Projeter ${summary}` : "Choisissez des versets"}
          </button>
        </div>
      )}
    </section>
  );
}
