import { useRef, useState } from "react";
import { partLabel } from "../songs/search.ts";
import type { Song, SongPart, SongPartKind } from "../songs/types";
import { songId } from "../songs/userSongs.ts";
import "./SongEditor.css";

interface SongEditorProps {
  songs: Song[];
  onSave: (songs: Song[]) => void;
}

const KINDS: Array<{ kind: SongPartKind; label: string }> = [
  { kind: "strophe", label: "Strophe" },
  { kind: "refrain", label: "Refrain" },
  { kind: "pont", label: "Pont" },
  { kind: "final", label: "Final" },
];

interface Draft {
  id: string | null;
  title: string;
  number: string;
  author: string;
  parts: SongPart[];
}

const EMPTY: Draft = {
  id: null,
  title: "",
  number: "",
  author: "",
  parts: [{ kind: "strophe", number: 1, body: "" }],
};

function toDraft(song: Song): Draft {
  return {
    id: song.id,
    title: song.title,
    number: song.number === undefined ? "" : String(song.number),
    author: song.author ?? "",
    parts: song.parts.map((p) => ({ ...p })),
  };
}

/**
 * Saisie d'un cantique sans passer par le fichier JSON. Le §15 rappelle que le
 * concurrent réel est la confiance du technicien : demander d'éditer des
 * accolades à la main un dimanche matin ne l'inspire pas.
 */
export function SongEditor({ songs, onSave }: SongEditorProps) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function setPart(index: number, patch: Partial<SongPart>) {
    setDraft((d) => ({
      ...d,
      parts: d.parts.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));
  }

  function addPart(kind: SongPartKind) {
    setDraft((d) => {
      // Les parties de même nature se numérotent d'elles-mêmes : l'opérateur
      // n'a pas à tenir le compte des strophes.
      const sameKind = d.parts.filter((p) => p.kind === kind).length;
      const part: SongPart = {
        kind,
        body: "",
        ...(kind === "strophe" || sameKind > 0 ? { number: sameKind + 1 } : {}),
      };
      return { ...d, parts: [...d.parts, part] };
    });
  }

  function removePart(index: number) {
    setDraft((d) => ({ ...d, parts: d.parts.filter((_, i) => i !== index) }));
  }

  function movePart(index: number, delta: -1 | 1) {
    setDraft((d) => {
      const target = index + delta;
      if (target < 0 || target >= d.parts.length) return d;
      const parts = [...d.parts];
      [parts[index], parts[target]] = [parts[target], parts[index]];
      return { ...d, parts };
    });
  }

  function save() {
    const title = draft.title.trim();
    if (!title) {
      setError("Le titre est obligatoire.");
      return;
    }
    const parts = draft.parts
      .map((p) => ({ ...p, body: p.body.trim() }))
      .filter((p) => p.body !== "");
    if (parts.length === 0) {
      setError("Ajoutez au moins une strophe avec du texte.");
      return;
    }

    const number = draft.number.trim() === "" ? undefined : Number(draft.number);
    if (number !== undefined && (!Number.isFinite(number) || number <= 0)) {
      setError("Le numéro doit être un nombre positif.");
      return;
    }

    const song: Song = {
      id: draft.id ?? songId(title),
      title,
      ...(number === undefined ? {} : { number }),
      ...(draft.author.trim() === "" ? {} : { author: draft.author.trim() }),
      parts,
    };

    const others = songs.filter((s) => s.id !== song.id);
    onSave([...others, song].sort((a, b) => (a.number ?? 9999) - (b.number ?? 9999)));
    setDraft(EMPTY);
    setError(null);
  }

  function exportSongs() {
    const blob = new Blob([JSON.stringify({ songs }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mes-cantiques.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importSongs(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as { songs?: Song[] } | Song[];
      const incoming = Array.isArray(parsed) ? parsed : (parsed.songs ?? []);
      if (!Array.isArray(incoming) || incoming.length === 0) {
        setError("Ce fichier ne contient aucun cantique.");
        return;
      }
      const ids = new Set(incoming.map((s) => s.id));
      onSave([...songs.filter((s) => !ids.has(s.id)), ...incoming]);
      setError(null);
    } catch {
      setError("Fichier illisible : ce n'est pas un export de cantiques.");
    }
  }

  return (
    <section className="editor" aria-label="Cantiques">
      <div className="editor__body">
        <h3 className="editor__subtitle">
          {draft.id === null ? "Nouveau cantique" : "Modifier le cantique"}
        </h3>
        <div className="editor__grid">
          <label className="editor__field editor__field--wide">
            <span className="editor__label">Titre</span>
            <input
              className="editor__input"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="À toi la gloire"
            />
          </label>
          <label className="editor__field">
            <span className="editor__label">Numéro</span>
            <input
              className="editor__input"
              value={draft.number}
              onChange={(e) => setDraft({ ...draft, number: e.target.value })}
              placeholder="12"
              inputMode="numeric"
            />
          </label>
        </div>

        <label className="editor__field">
          <span className="editor__label">Auteur (jamais projeté)</span>
          <input
            className="editor__input"
            value={draft.author}
            onChange={(e) => setDraft({ ...draft, author: e.target.value })}
            placeholder="Edmond Louis Budry, 1884"
          />
        </label>

        {draft.parts.map((part, index) => (
          <div key={index} className="editor__part">
            <div className="editor__part-head">
              <select
                className="editor__kind"
                value={part.kind}
                onChange={(e) => setPart(index, { kind: e.target.value as SongPartKind })}
              >
                {KINDS.map((k) => (
                  <option key={k.kind} value={k.kind}>
                    {k.label}
                  </option>
                ))}
              </select>
              <span className="editor__part-label">{partLabel(part)}</span>
              <button
                type="button"
                className="editor__icon"
                onClick={() => movePart(index, -1)}
                disabled={index === 0}
                title="Monter"
              >
                ↑
              </button>
              <button
                type="button"
                className="editor__icon"
                onClick={() => movePart(index, 1)}
                disabled={index === draft.parts.length - 1}
                title="Descendre"
              >
                ↓
              </button>
              <button
                type="button"
                className="editor__icon editor__icon--danger"
                onClick={() => removePart(index)}
                title="Supprimer cette partie"
              >
                ×
              </button>
            </div>
            <textarea
              className="editor__textarea"
              value={part.body}
              rows={4}
              placeholder="Tapez le texte, une ligne par ligne comme il sera projeté."
              onChange={(e) => setPart(index, { body: e.target.value })}
            />
          </div>
        ))}

        <div className="editor__adders">
          {KINDS.map((k) => (
            <button
              key={k.kind}
              type="button"
              className="editor__add"
              onClick={() => addPart(k.kind)}
            >
              + {k.label}
            </button>
          ))}
        </div>

        {error && <p className="editor__error">{error}</p>}

        <div className="editor__actions">
          <button type="button" className="editor__save" onClick={save}>
            Enregistrer
          </button>
          {draft.id !== null && (
            <button
              type="button"
              className="editor__cancel"
              onClick={() => {
                setDraft(EMPTY);
                setError(null);
              }}
            >
              Annuler la modification
            </button>
          )}
        </div>

        <div className="editor__list">
          <h3 className="editor__subtitle">
            Mes cantiques {songs.length > 0 && `(${songs.length})`}
          </h3>
          {songs.length === 0 && (
            <p className="editor__hint">
              Aucun pour l'instant. Ceux du recueil livré restent disponibles.
            </p>
          )}
          {songs.map((song) => (
            <div key={song.id} className="editor__row">
              <span className="editor__row-title">
                {song.number !== undefined && `${song.number} · `}
                {song.title}
              </span>
              <button
                type="button"
                className="editor__icon"
                onClick={() => setDraft(toDraft(song))}
                title="Modifier"
              >
                ✎
              </button>
              <button
                type="button"
                className="editor__icon editor__icon--danger"
                onClick={() => onSave(songs.filter((s) => s.id !== song.id))}
                title="Supprimer"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Le stockage navigateur est la seule mémoire en phase 1 : l'export
            est la seule sauvegarde possible, et la reprise pour la phase 2. */}
        <div className="editor__actions">
          <button
            type="button"
            className="editor__secondary"
            onClick={exportSongs}
            disabled={songs.length === 0}
          >
            Exporter mes cantiques
          </button>
          <button
            type="button"
            className="editor__secondary"
            onClick={() => fileRef.current?.click()}
          >
            Importer
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importSongs(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </section>
  );
}
