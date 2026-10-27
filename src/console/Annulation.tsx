import "./Annulation.css";

interface BandeauAnnulationProps {
  libelle: string;
  onAnnuler: () => void;
  onMasquer: () => void;
  /**
   * Collé au bas d'une liste défilante, ou posé dans le flux juste sous ce qui
   * vient d'être supprimé. Une grille de quelques vignettes n'a pas besoin
   * d'être suivie ; une liste de 146 lignes, si.
   */
  collant?: boolean;
}

/**
 * Posé en bas de la liste où la suppression a eu lieu, collé au bord : la
 * liste défile, le recours reste visible quel que soit l'endroit où l'on se
 * trouvait au moment du clic.
 */
export function BandeauAnnulation({
  libelle,
  onAnnuler,
  onMasquer,
  collant = true,
}: BandeauAnnulationProps) {
  return (
    <div className={`annulation${collant ? "" : " annulation--flux"}`} role="status">
      <span className="annulation__texte">{libelle}</span>
      <button type="button" className="annulation__action" onClick={onAnnuler}>
        Annuler
      </button>
      <button
        type="button"
        className="annulation__masquer"
        onClick={onMasquer}
        aria-label="Masquer"
        title="Masquer"
      >
        ×
      </button>
    </div>
  );
}
