import {
  customerNotes,
  CUSTOMER_REVIEW_LABEL,
  developers,
  hoursFor,
  memberShort,
  partLabel,
  productOwner,
  retroNotes,
  reviewNotes,
  roleSprints,
  scrumMaster,
  SIMULATION_LABEL,
  sprintPackageHours,
  workRows,
} from '../../data/team.ts';
import styles from './Defense.module.css';

export function TeamSection() {
  return (
    <>
      <section
        className={styles.section}
        id="feedback"
        aria-labelledby="feedback-title"
      >
        <h2 id="feedback-title">10. Обратная связь</h2>
        {customerNotes.map((note) => (
          <figure className={styles.review} key={note.role}>
            <blockquote className={styles.prose}>{note.text}</blockquote>
            <figcaption>
              {CUSTOMER_REVIEW_LABEL}. {note.role}
            </figcaption>
          </figure>
        ))}
      </section>

      <section
        className={styles.section}
        id="retro"
        aria-labelledby="retro-title"
      >
        <h2 id="retro-title">11. Ретроспектива и выводы</h2>
        <p className={styles.note}>Текст ниже: {SIMULATION_LABEL}.</p>
        {retroNotes.map((note) => (
          <div key={note.heading}>
            <h3>{note.heading}</h3>
            <p className={styles.prose}>{note.text}</p>
          </div>
        ))}
      </section>

      <section
        className={styles.section}
        id="roles"
        aria-labelledby="roles-title"
      >
        <h2 id="roles-title">12. Роли</h2>
        <p>
          Product Owner, Scrum Master и Developers не меняются от спринта к
          спринту. Автор пакета и проверяющий назначены отдельно.
        </p>
        {roleSprints.map((sprint) => (
          <div key={sprint}>
            <h3>Спринт {sprint}</h3>
            <p>
              {productOwner.role}: {productOwner.name}
            </p>
            <p>
              {scrumMaster.role}: {scrumMaster.name}
            </p>
            <p>
              Developers: {developers.map((person) => person.name).join(', ')}
            </p>
          </div>
        ))}
        <div className={styles.scroll}>
          <table className={styles.table}>
            <caption>Часы по людям</caption>
            <thead>
              <tr>
                <th scope="col">Кто</th>
                {roleSprints.map((sprint) => (
                  <th scope="col" key={sprint}>
                    Спринт {sprint}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {memberShort.map((member) => (
                <tr key={member}>
                  <th scope="row">{member}</th>
                  {roleSprints.map((sprint) => (
                    <td key={sprint}>{hoursFor(member, sprint)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Всего</th>
                {roleSprints.map((sprint) => (
                  <td key={sprint}>{sprintPackageHours(sprint)}</td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
        {roleSprints.map((sprint) => (
          <div key={`packages-${sprint}`}>
            <h3>Спринт {sprint}, пакеты</h3>
            <ul className={styles.stack}>
              {workRows
                .filter((row) => row.sprint === sprint)
                .map((row) => (
                  <li key={`${row.item}-${row.member}-${row.activity}`}>
                    <p>
                      {row.item}. {row.work}. {row.activity}. {row.member},{' '}
                      {row.hours} ч, {partLabel(row.part)}.
                    </p>
                  </li>
                ))}
            </ul>
          </div>
        ))}
        {reviewNotes.map((note) => (
          <p className={styles.prose} key={note}>
            {note}
          </p>
        ))}
      </section>
    </>
  );
}
