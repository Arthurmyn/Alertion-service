import { unmetRows } from '../../data/results.ts';
import styles from './Defense.module.css';
import { sectionTitle } from './links.ts';

export function UnmetSection() {
  return (
    <section
      className={styles.section}
      id="unmet"
      aria-labelledby="unmet-title"
    >
      <h2 id="unmet-title">{sectionTitle.unmet}</h2>
      <p>Пункты процесса, ролей и отчёта. На экранах их нет.</p>
      <div className={styles.scroll}>
        <table className={`${styles.table} ${styles.criteria}`}>
          <caption>Невыполненные и непроверяемые</caption>
          <thead>
            <tr>
              <th scope="col">Пункт</th>
              <th scope="col">Отметка</th>
              <th scope="col">Почему</th>
            </tr>
          </thead>
          <tbody>
            {unmetRows.map((item) => (
              <tr key={item.title}>
                <th scope="row">{item.title}</th>
                <td>{item.mark}</td>
                <td>
                  {item.quote ? <span lang="en">{item.quote} </span> : null}
                  {item.detail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
