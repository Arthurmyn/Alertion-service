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
import { sectionTitle } from './links.ts';

export function TeamSection() {
  return (
    <>
      <section
        className={styles.section}
        id="feedback"
        aria-labelledby="feedback-title"
      >
        <h2 id="feedback-title">{sectionTitle.feedback}</h2>
        {customerNotes.map((note) => (
          <figure className={styles.review} key={note.role}>
            <figcaption>
              {CUSTOMER_REVIEW_LABEL}. {note.role}
            </figcaption>
            <blockquote className={styles.prose}>{note.text}</blockquote>
          </figure>
        ))}
      </section>

      <section
        className={styles.section}
        id="retro"
        aria-labelledby="retro-title"
      >
        <h2 id="retro-title">{sectionTitle.retro}</h2>
        <p className={styles.note}>Записи ретроспективы: {SIMULATION_LABEL}.</p>
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
        <h2 id="roles-title">{sectionTitle.roles}</h2>
        <p>
          Product Owner, Scrum Master и Developers не меняются от спринта к
          спринту. Автор пакета и проверяющий назначены отдельно.
        </p>
        <p>
          {productOwner.role}: {productOwner.name}
        </p>
        <p>
          {scrumMaster.role}: {scrumMaster.name}
        </p>
        <p>Developers: {developers.map((person) => person.name).join(', ')}</p>
        <div className={styles.scroll}>
          <table className={styles.table}>
            <caption>План, часы по людям</caption>
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
        <p>
          Пакеты ниже тоже план: пункт, работа, часы, автор или проверяющий.
        </p>
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
