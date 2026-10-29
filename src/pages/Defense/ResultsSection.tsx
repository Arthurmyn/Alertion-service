import {
  results,
  scenarioHref,
  SCREENSHOT_EMPTY,
  type ResultRow,
} from '../../data/results.ts';
import { scenarioById } from '../../data/scenarios.ts';
import styles from './Defense.module.css';
import { sectionTitle } from './links.ts';
import { WideTable } from './WideTable.tsx';

function RichText({ text }: { text: string }) {
  const parts = text.split(/`([^`]+)`/g);
  return parts.map((part, index) =>
    index % 2 === 1 ? <code key={index}>{part}</code> : part,
  );
}

function ScenarioLinks({ ids }: { ids: readonly string[] }) {
  return ids.map((id, index) => {
    const scenario = scenarioById(id);
    return (
      <span key={id}>
        {index > 0 ? ', ' : null}
        <a href={scenarioHref(id)}>{scenario ? scenario.title : id}</a>
      </span>
    );
  });
}

function ResultLinks({ item }: { item: ResultRow }) {
  return (
    <>
      {item.href ? <a href={item.href}>Раздел целей</a> : null}
      {item.href && item.scenarioIds.length > 0 ? ' ' : null}
      <ScenarioLinks ids={item.scenarioIds} />
    </>
  );
}

export function ResultsSection() {
  return (
    <section
      className={styles.section}
      id="results"
      aria-labelledby="results-title"
    >
      <h2 id="results-title">{sectionTitle.results}</h2>
      <p>
        Строка ведёт в сценарий или в раздел целей. Колонка скриншота без
        файлов.
      </p>
      <WideTable noteId="results-scroll">
        <table className={`${styles.table} ${styles.criteria}`}>
          <caption>Критерии B1–B7</caption>
          <thead>
            <tr>
              <th scope="col">Критерий</th>
              <th scope="col">Ожидание</th>
              <th scope="col">Показано</th>
              <th scope="col">Сценарий</th>
              <th scope="col">Скриншот</th>
            </tr>
          </thead>
          <tbody>
            {results.map((item) => (
              <tr key={item.id}>
                <th scope="row">{item.id}</th>
                <td lang="en">{item.quote}</td>
                <td>
                  <RichText text={item.shown} />
                </td>
                <td>
                  <ResultLinks item={item} />
                </td>
                <td className={styles.empty}>
                  {item.screenshot ?? SCREENSHOT_EMPTY}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </WideTable>
    </section>
  );
}
