import type { BibleVersion } from "../bible/bible.ts";
import "./StatusBlock.css";

interface StatusBlockProps {
  /** Une fenêtre de projection s'est manifestée récemment. */
  salleOuverte: boolean;
  /** Une incrustation est branchée au relais. */
  incrustationBranchee: boolean;
  version: BibleVersion;
  /** Instant du premier passage à l'antenne, ou null si rien n'a été projeté. */
  debutCulte: number | null;
  /** Horloge fournie par la console : un seul minuteur pour toute la régie. */
  maintenant: number;
}

function deuxChiffres(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Heure, durée écoulée et état réel des sorties.
 *
 * L'horaire compte : le culte est diffusé en direct, et la barre des tâches
 * disparaît dès que la régie passe en plein écran. Les voyants répondent à la
 * question qu'on se pose cinq minutes avant de commencer — est-ce que ça sort
 * vraiment ? — à laquelle il fallait jusqu'ici répondre en projetant.
 */
export function StatusBlock({
  salleOuverte,
  incrustationBranchee,
  version,
  debutCulte,
  maintenant,
}: StatusBlockProps) {
  const heure = new Date(maintenant);
  const ecoule =
    debutCulte === null ? null : Math.max(0, Math.floor((maintenant - debutCulte) / 60000));

  return (
    <section className="etat" aria-label="État de la régie">
      <div className="etat__heure">
        <span className="etat__horloge">
          {deuxChiffres(heure.getHours())}:{deuxChiffres(heure.getMinutes())}
        </span>
        {ecoule !== null && <span className="etat__ecoule">culte · {ecoule} min</span>}
      </div>

      <div className="etat__voyants">
        <span className={`voyant${salleOuverte ? " voyant--on" : ""}`}>
          <span className="voyant__point" />
          Salle
        </span>
        {/* Le relais sait qu'un client est branché, pas que c'est OBS : un
            onglet /overlay ouvert dans le navigateur allume le même voyant.
            L'étiquette reste donc « incrustation ». */}
        <span className={`voyant${incrustationBranchee ? " voyant--on" : ""}`}>
          <span className="voyant__point" />
          Incrustation
        </span>
        <span className="voyant voyant--info">{version.abbrev}</span>
      </div>
    </section>
  );
}
