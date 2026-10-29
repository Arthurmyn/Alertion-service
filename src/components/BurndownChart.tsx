import type { SprintNumber } from '../data/backlogItems.ts';
import { pointsAttr, seriesPoints } from '../data/metrics.ts';
import page from '../pages/Defense/Defense.module.css';
import styles from './BurndownChart.module.css';

const width = 640;
const height = 160;
const frame = { x0: 6, y0: 6, x1: width - 6, y1: height - 6 };

function tick(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function BurndownChart({
  sprint,
  dates,
  plan,
  simulated,
}: {
  sprint: SprintNumber;
  dates: readonly string[];
  plan: readonly number[];
  simulated: readonly number[];
}) {
  const max = Math.max(...plan, ...simulated, 0);
  const planLine = pointsAttr(seriesPoints(plan, frame, max));
  const simLine = pointsAttr(seriesPoints(simulated, frame, max));
  const end = dates[dates.length - 1] ?? '';
  const midY = (frame.y0 + frame.y1) / 2;
  const tableId = `burndown-s${sprint}`;
  const dayLabels = ['старт', ...dates];

  return (
    <div className={styles.block}>
      <h3 className={styles.caption}>
        Спринт {sprint}, {dates[0]}–{end}
      </h3>
      <p className={styles.legend}>
        <span className={styles.planKey}>план</span>
        <span className={styles.simKey}>симуляция</span>
      </p>
      <div className={styles.plot}>
        <div className={styles.axis} aria-hidden="true">
          <span>{tick(max)} ч</span>
          <span>{tick(max / 2)}</span>
          <span>0</span>
        </div>
        <svg
          className={styles.chart}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Спринт ${sprint}: линия плана и линия симуляции`}
          aria-describedby={tableId}
        >
          <title>{`Спринт ${sprint}`}</title>
          <line
            className={styles.grid}
            x1={frame.x0}
            y1={frame.y0}
            x2={frame.x1}
            y2={frame.y0}
          />
          <line
            className={styles.grid}
            x1={frame.x0}
            y1={midY}
            x2={frame.x1}
            y2={midY}
          />
          <line
            className={styles.grid}
            x1={frame.x0}
            y1={frame.y1}
            x2={frame.x1}
            y2={frame.y1}
          />
          <polyline
            className={styles.planLine}
            points={planLine}
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            className={styles.simLine}
            points={simLine}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className={styles.days} aria-hidden="true">
          {dayLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
      <div className={page.scroll}>
        <table className={page.table} id={tableId}>
          <caption>Спринт {sprint}, оставшиеся часы</caption>
          <thead>
            <tr>
              <th scope="col">День</th>
              <th scope="col">Дата</th>
              <th scope="col">план</th>
              <th scope="col">симуляция</th>
            </tr>
          </thead>
          <tbody>
            {plan.map((planned, index) => (
              <tr key={index}>
                <th scope="row">{index}</th>
                <td>{index === 0 ? 'старт' : dates[index - 1]}</td>
                <td>{planned}</td>
                <td>{simulated[index]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
