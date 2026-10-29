import { BurndownChart } from '../../components/BurndownChart.tsx';
import {
  backlogItems,
  sprintWorkHours,
  totalWorkHours,
  workHours,
  type SprintNumber,
} from '../../data/backlogItems.ts';
import {
  completedHours,
  planRemaining,
  simulatedRemaining,
  sprintStart,
  WORKING_DAYS,
  workingDays,
} from '../../data/metrics.ts';
import styles from './Defense.module.css';

const sprints = [1, 2, 3] as const satisfies readonly SprintNumber[];

export function MetricsSection() {
  return (
    <>
      <section
        className={styles.section}
        id="plan"
        aria-labelledby="plan-title"
      >
        <h2 id="plan-title">8. План и симуляция</h2>
        <p>
          Часы пунктов по спринтам. В каждом спринте {sprintWorkHours(1)}{' '}
          рабочих часов. Фактические часы подписаны «симуляция» на графиках
          ниже.
        </p>
        <ul className={styles.stack}>
          {backlogItems.map((item) => (
            <li key={item.id}>
              <p>
                {item.id}. {item.title}
              </p>
              <p>
                {sprints.map((sprint) => {
                  const hours = item.hoursBySprint[sprint];
                  if (!hours) return null;
                  return (
                    <span key={sprint}>
                      Спринт {sprint}: {hours} ч.{' '}
                    </span>
                  );
                })}
                Всего {workHours(item)} ч.
              </p>
            </li>
          ))}
        </ul>
        <p>
          По спринтам:{' '}
          {sprints.map((sprint) => `${sprintWorkHours(sprint)} ч`).join(', ')}.
          Вместе {totalWorkHours()} ч.
        </p>
      </section>

      <section
        className={styles.section}
        id="burndown"
        aria-labelledby="burndown-title"
      >
        <h2 id="burndown-title">9. Сгорание и скорость</h2>
        <p>
          Три графика. В плане оставшиеся часы идут от {sprintWorkHours(1)} к 0
          за {WORKING_DAYS} рабочих дней. Линия плана подписана «план». Вторая
          линия подписана «симуляция».
        </p>
        {sprints.map((sprint) => (
          <BurndownChart
            key={sprint}
            sprint={sprint}
            dates={workingDays(sprintStart[sprint])}
            plan={planRemaining(sprintWorkHours(sprint))}
            simulated={simulatedRemaining[sprint]}
          />
        ))}
        <div className={styles.scroll}>
          <table className={styles.table}>
            <caption>Скорость, закрытые рабочие часы</caption>
            <thead>
              <tr>
                <th scope="col">Спринт</th>
                <th scope="col">план</th>
                <th scope="col">симуляция</th>
              </tr>
            </thead>
            <tbody>
              {sprints.map((sprint) => (
                <tr key={sprint}>
                  <th scope="row">{sprint}</th>
                  <td>{sprintWorkHours(sprint)}</td>
                  <td>{completedHours(simulatedRemaining[sprint])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.note}>
          26 story points на рисунке 1 не единица учёта. Оценки бэклога указаны
          в рабочих часах.
        </p>
      </section>
    </>
  );
}
