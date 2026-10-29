import { sprintNumbers } from '../../data/metrics.ts';
import {
  EMPTY_SLOT_LABEL,
  evidenceFileName,
  evidenceSlots,
} from '../../data/sprintEvidence.ts';
import styles from './Defense.module.css';

export function EvidenceLogSection() {
  return (
    <section
      className={styles.section}
      id="evidence-log"
      aria-labelledby="evidence-title"
    >
      <h2 id="evidence-title">13. Журнал доказательств</h2>
      <p>
        Слоты названы по спринту, пункту и проверке. Ни один слот не заполнен.
      </p>
      {sprintNumbers.map((sprint) => (
        <div key={sprint}>
          <h3 id={`evidence-s${sprint}`}>Спринт {sprint}</h3>
          <ul className={styles.stack} aria-labelledby={`evidence-s${sprint}`}>
            {evidenceSlots
              .filter((item) => item.sprint === sprint)
              .map((item) => (
                <li key={evidenceFileName(item)}>
                  <p className={styles.mono}>{evidenceFileName(item)}</p>
                  <p>{item.title}</p>
                  <p className={styles.empty}>{EMPTY_SLOT_LABEL}</p>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
