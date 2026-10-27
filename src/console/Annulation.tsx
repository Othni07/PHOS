import "./Annulation.css";

interface BandeauAnnulationProps {
  libelle: string;
  onAnnuler: () => void;
  onMasquer: () => void;
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
}: BandeauAnnulationProps) {
  return (
    <div className="annulation" role="status">
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
