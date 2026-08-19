import { useEffect, useRef, useState } from "react";
import {
  loadBackgrounds,
  prepareImage,
  saveBackgrounds,
  STORE_LIMIT,
  totalSize,
  type BackgroundImage,
} from "../shared/backgrounds.ts";
import {
  DURATION_MAX,
  DURATION_MIN,
  SCALE_MAX,
  SCALE_MIN,
  TICKER_MAX_LENGTH,
  type ProjectionBackground,
  type Ticker,
} from "../shared/settings.ts";

interface ProjectionSettingsProps {
  background: ProjectionBackground;
  ticker: Ticker;
  onBackground: (background: ProjectionBackground) => void;
  onTicker: (ticker: Ticker) => void;
}

/**
 * Réglages de la sortie en salle : fond d'image et bandeau défilant. Ils ne
 * touchent jamais l'incrustation OBS, qui doit rester transparente (§7).
 */
export function ProjectionSettings({
  background,
  ticker,
  onBackground,
  onTicker,
}: ProjectionSettingsProps) {
  const [images, setImages] = useState<BackgroundImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadBackgrounds().then(setImages);
  }, []);

  async function persist(next: BackgroundImage[]) {
    setImages(next);
    await saveBackgrounds(next);
  }

  async function importImage(file: File) {
    setError(null);
    try {
      const image = await prepareImage(file);
      const next = [...images, image];
      if (totalSize(next) > STORE_LIMIT) {
        setError(
          "Plus de place : le navigateur ne peut pas tout garder. Supprimez une image avant d'en ajouter une autre.",
        );
        return;
      }
      await persist(next);
      onBackground({ ...background, imageId: image.id });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Import impossible.");
    }
  }

  async function remove(id: string) {
    await persist(images.filter((image) => image.id !== id));
    if (background.imageId === id) onBackground({ ...background, imageId: null });
  }

  const used = Math.round((totalSize(images) / STORE_LIMIT) * 100);

  return (
    <>
      <h3 className="appearance__heading">Fond de la projection en salle</h3>

      <div className="appearance__section">
        <p className="appearance__help">
          Ce fond n'apparaît que sur le vidéoprojecteur. L'incrustation OBS
          reste transparente, pour ne pas masquer la caméra.
        </p>

        <div className="fonds">
          <button
            type="button"
            className={`fond fond--none${background.imageId === null ? " fond--on" : ""}`}
            onClick={() => onBackground({ ...background, imageId: null })}
          >
            Fond noir
          </button>
          {images.map((image) => (
            <div key={image.id} className="fond-wrap">
              <button
                type="button"
                className={`fond${background.imageId === image.id ? " fond--on" : ""}`}
                style={{ backgroundImage: `url(${image.dataUrl})` }}
                onClick={() => onBackground({ ...background, imageId: image.id })}
                title={image.name}
              >
                <span className="fond__name">{image.name}</span>
              </button>
              <button
                type="button"
                className="fond__remove"
                onClick={() => void remove(image.id)}
                title="Supprimer cette image"
                aria-label={`Supprimer ${image.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="appearance__row">
          <button
            type="button"
            className="appearance__reset"
            onClick={() => fileRef.current?.click()}
          >
            Importer une image
          </button>
          <span className="appearance__legend">
            {images.length} image{images.length > 1 ? "s" : ""} · {used} % de la place
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importImage(file);
              e.target.value = "";
            }}
          />
        </div>

        {error && <p className="appearance__error">{error}</p>}

        <label className="appearance__field">
          <span className="appearance__label">
            Opacité de l'image
            <span className="appearance__value">
              {Math.round(background.opacity * 100)} %
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={background.opacity}
            disabled={background.imageId === null}
            onChange={(e) =>
              onBackground({ ...background, opacity: Number(e.target.value) })
            }
          />
        </label>

        <label className="appearance__field">
          <span className="appearance__label">
            Taille de l'image
            <span className="appearance__value">
              {Math.round(background.scale * 100)} %
            </span>
          </span>
          <input
            type="range"
            min={SCALE_MIN}
            max={SCALE_MAX}
            step={0.05}
            value={background.scale}
            disabled={background.imageId === null}
            onChange={(e) =>
              onBackground({ ...background, scale: Number(e.target.value) })
            }
          />
        </label>
      </div>

      <h3 className="appearance__heading">Bandeau défilant</h3>

      <div className="appearance__section">
        <label className="appearance__field">
          <span className="appearance__label">
            Texte
            <span className="appearance__value">
              {ticker.text.length} / {TICKER_MAX_LENGTH}
            </span>
          </span>
          <textarea
            className="appearance__textarea"
            rows={2}
            maxLength={TICKER_MAX_LENGTH}
            value={ticker.text}
            placeholder="Réunion de prière mercredi à 19 h · Bienvenue aux visiteurs"
            onChange={(e) => onTicker({ ...ticker, text: e.target.value })}
          />
        </label>

        <label className="appearance__row">
          <input
            type="checkbox"
            checked={ticker.enabled}
            onChange={(e) => onTicker({ ...ticker, enabled: e.target.checked })}
          />
          <span className="appearance__legend">Afficher le bandeau en salle</span>
        </label>

        <label className="appearance__field">
          <span className="appearance__label">
            Vitesse
            <span className="appearance__value">{ticker.durationSec} s par passage</span>
          </span>
          <input
            type="range"
            min={DURATION_MIN}
            max={DURATION_MAX}
            step={1}
            value={ticker.durationSec}
            onChange={(e) =>
              onTicker({ ...ticker, durationSec: Number(e.target.value) })
            }
          />
        </label>
      </div>
    </>
  );
}
