import {
  goals,
  observationMark,
  scenarioHref,
  scopeNote,
  scopeVolumeNote,
  type GoalRow,
} from '../../data/results.ts';
import { scenarioById } from '../../data/scenarios.ts';
import { EMPTY_SLOT_LABEL } from '../../data/sprintEvidence.ts';
import { memberShort } from '../../data/team.ts';
import styles from './Defense.module.css';
import { sectionTitle } from './links.ts';

function GoalReason({ goal }: { goal: GoalRow }) {
  if (!goal.scenarioId) return goal.reason;
  const scenario = scenarioById(goal.scenarioId);
  return (
    <>
      {goal.reason}{' '}
      <a href={scenarioHref(goal.scenarioId)}>
        {scenario ? scenario.title : goal.scenarioId}
      </a>
    </>
  );
}

export function GoalsSection() {
  return (
    <section
      className={styles.section}
      id="goals"
      aria-labelledby="goals-title"
    >
      <h2 id="goals-title">{sectionTitle.goals}</h2>
      <p>
        {scopeNote}. {scopeVolumeNote}
      </p>
      <p>Проход 5 участников не проводили. В листе нет записей о попытке.</p>
      <div className={styles.scroll}>
        <table className={`${styles.table} ${styles.criteria}`}>
          <caption>Цели и лист наблюдений</caption>
          <thead>
            <tr>
              <th scope="col">Цель</th>
              <th scope="col">Формулировка</th>
              <th scope="col">Отметка</th>
              <th scope="col">Основание</th>
              <th scope="col">Решение</th>
            </tr>
          </thead>
          <tbody>
            {goals.map((goal) => (
              <tr key={goal.id}>
                <th scope="row">{goal.id}</th>
                <td lang="en">{goal.quote}</td>
                <td>{goal.mark}</td>
                <td>
                  <GoalReason goal={goal} />
                </td>
                <td>{goal.decision}</td>
              </tr>
            ))}
          </tbody>
          <tbody>
            <tr>
              <th colSpan={5} scope="colgroup">
                Лист наблюдений
              </th>
            </tr>
            {memberShort.map((name) => (
              <tr key={name}>
                <th scope="row">{name}</th>
                <td className={styles.empty}>{EMPTY_SLOT_LABEL}</td>
                <td>{observationMark}</td>
                <td className={styles.empty}>{EMPTY_SLOT_LABEL}</td>
                <td className={styles.empty}>{EMPTY_SLOT_LABEL}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
