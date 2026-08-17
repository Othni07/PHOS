import { useEffect, useRef, useState } from "react";
import { platform, type ScreenInfo } from "../platform";
import "./ScreenPicker.css";

/**
 * Choix de l'écran de projection (§4, mécanisme 2).
 *
 * La Window Management API n'est disponible que sur Chrome/Edge/Brave, en
 * localhost ou HTTPS, et après accord de l'utilisateur. On la sollicite au
 * clic — une permission ne peut être demandée que sur un geste — et on retombe
 * silencieusement sur la fenêtre à glisser quand elle manque.
 */
export function ScreenPicker() {
  const [screens, setScreens] = useState<ScreenInfo[] | null>(null);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  async function choose() {
    const found = await platform.listScreens();
    setScreens(found);
    // Un seul écran, ou permission refusée : rien à choisir, on ouvre.
    if (found.length <= 1) {
      await platform.openProjection();
      return;
    }
    setOpen(true);
  }

  async function project(screen: ScreenInfo) {
    setOpen(false);
    await platform.openProjection(screen.id);
  }

  return (
    <div className="picker" ref={rootRef}>
      <button type="button" className="control-button" onClick={() => void choose()}>
        Projeter sur…
      </button>

      {open && screens && (
        <div className="picker__menu" role="menu">
          {screens.map((screen) => (
            <button
              key={screen.id}
              type="button"
              className="picker__item"
              role="menuitem"
              onClick={() => void project(screen)}
            >
              <span className="picker__name">
                {screen.label}
                {screen.isPrimary && <span className="picker__tag">principal</span>}
              </span>
              <span className="picker__size">
                {screen.width} × {screen.height}
              </span>
            </button>
          ))}
          <button
            type="button"
            className="picker__item picker__item--fallback"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void platform.openProjection();
            }}
          >
            <span className="picker__name">Fenêtre à glisser</span>
            <span className="picker__size">puis F11</span>
          </button>
        </div>
      )}
    </div>
  );
}
