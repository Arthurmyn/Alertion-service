import { BurndownChart } from './BurndownChart.tsx';
import {
  backlogItems,
  sprintWorkHours,
  totalWorkHours,
  workHours,
  type BacklogItem,
} from '../../data/backlogItems.ts';
import {
  completedHours,
  planRemaining,
  simulatedRemaining,
  sprintNumbers,
  sprintStart,
  WORKING_DAYS,
  workingDays,
} from '../../data/metrics.ts';
import styles from './Defense.module.css';
import { sectionTitle } from './links.ts';

function planHours(item: BacklogItem): string {
  const parts = sprintNumbers.flatMap((sprint) => {
    const hours = item.hoursBySprint[sprint];
    return hours === undefined ? [] : [`Спринт ${sprint}: ${hours} ч`];
  });
  return `${parts.join(', ')}. Всего ${workHours(item)} ч.`;
}

export function MetricsSection() {
  return (
    <>
      <section
        className={styles.section}
        id="plan"
        aria-labelledby="plan-title"
      >
        <h2 id="plan-title">{sectionTitle.plan}</h2>
        <p>
          Часы в таблице подписаны как план. В каждом спринте{' '}
          {sprintWorkHours(1)} рабочих часов. На графиках ниже линия «план» и
          линия «симуляция».
        </p>
        <div className={styles.scroll}>
          <table className={`${styles.table} ${styles.wrap}`}>
            <caption>План, рабочие часы</caption>
            <thead>
              <tr>
                <th scope="col">Пункт</th>
                <th scope="col">Часы</th>
              </tr>
            </thead>
            <tbody>
              {backlogItems.map((item) => (
                <tr key={item.id}>
                  <th scope="row">
                    {item.id}. {item.title}
                  </th>
                  <td>{planHours(item)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          По спринтам:{' '}
          {sprintNumbers
            .map((sprint) => `${sprintWorkHours(sprint)} ч`)
            .join(', ')}
          . Вместе {totalWorkHours()} ч.
        </p>
      </section>

      <section
        className={styles.section}
        id="burndown"
        aria-labelledby="burndown-title"
      >
        <h2 id="burndown-title">{sectionTitle.burndown}</h2>
        <p>
          Три графика. В плане оставшиеся часы идут от {sprintWorkHours(1)} к 0
          за {WORKING_DAYS} рабочих дней. Линия «план» сплошная. Линия
          «симуляция» пунктирная. Таблица под графиком повторяет те же числа.
        </p>
        {sprintNumbers.map((sprint) => (
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
              {sprintNumbers.map((sprint) => (
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
