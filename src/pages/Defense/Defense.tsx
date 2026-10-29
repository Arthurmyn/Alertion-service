import { Link } from 'react-router-dom';
import {
  backlogItems,
  workHours,
  type BacklogItem,
} from '../../data/backlogItems.ts';
import { LIMITS } from '../../data/limits.ts';
import { sprintNumbers } from '../../data/metrics.ts';
import { developers, productOwner, scrumMaster } from '../../data/team.ts';
import { accountSlug } from '../../routing.ts';
import { useStore } from '../../state/store.tsx';
import styles from './Defense.module.css';
import { EvidenceLogSection } from './EvidenceLogSection.tsx';
import { defenseHref, screenLabel, stepHref, userPath } from './links.ts';
import { MetricsSection } from './MetricsSection.tsx';
import { TeamSection } from './TeamSection.tsx';

function hoursText(item: BacklogItem): string {
  const total = `${workHours(item)} ч`;
  const parts = sprintNumbers.flatMap((sprint) => {
    const hours = item.hoursBySprint[sprint];
    return hours === undefined ? [] : [`${hours} ч в спринте ${sprint}`];
  });
  if (parts.length < 2) return total;
  return `${total}, из них ${parts.join(', ')}`;
}

export function Defense() {
  const { state } = useStore();
  const slug = accountSlug(state.sessionAccountId);
  const signedIn = slug !== null;

  return (
    <article>
      <h1>Защита проекта</h1>

      <section
        className={styles.section}
        id="goal"
        aria-labelledby="goal-title"
      >
        <h2 id="goal-title">1. Цель проекта</h2>
        <p className={styles.prose}>
          Сервис для владельца малого бизнеса, у которого статический сайт уже
          есть и его нужно опубликовать или обновить. Второй пользователь:
          фрилансер, который готовит файлы.
        </p>
        <p className={styles.prose}>
          Маршрут такой: готовые HTML, CSS, браузерный JavaScript и картинки,
          затем предпросмотр, публикация и возврат предыдущей версии.
        </p>
        <p>
          {productOwner.name}, {productOwner.role}. {scrumMaster.name},{' '}
          {scrumMaster.role}. Developers:{' '}
          {developers.map((person) => person.name).join(', ')}.
        </p>
        <p>
          Срок: 28.10.2026–17.11.2026. Преподаватель: Zhansaya Shinbergenova.
        </p>
        <p>Лимиты пилотного плана.</p>
        <dl className={styles.limits}>
          <dt>Сайтов на аккаунт</dt>
          <dd>{LIMITS.sites}</dd>
          <dt>Архив, МБ</dt>
          <dd>{LIMITS.archiveMb}</dd>
          <dt>Распаковка, МБ</dt>
          <dd>{LIMITS.unpackedMb}</dd>
          <dt>Хранилище, МБ</dt>
          <dd>{LIMITS.storageMb}</dd>
        </dl>
      </section>

      <section
        className={styles.section}
        id="path"
        aria-labelledby="path-title"
      >
        <h2 id="path-title">2. Путь пользователя</h2>
        <p>
          Пять шагов. Файлы выбирают на экране загрузки. Публикация и откат
          открывают экран версий.
        </p>
        {signedIn ? null : (
          <p className={styles.note}>
            Без входа эти шаги открывают страницу входа.
          </p>
        )}
        <ol className={styles.path}>
          {userPath.map((step) => (
            <li key={step.label}>
              <Link to={stepHref(slug, step.suffix)}>{step.label}</Link>
            </li>
          ))}
        </ol>
      </section>

      <section
        className={styles.section}
        id="status"
        aria-labelledby="status-title"
      >
        <h2 id="status-title">4. Статус B1–B8</h2>
        <p className={styles.note}>
          {signedIn
            ? 'Ссылки ведут на сайт nan.'
            : 'Без входа ссылки на управление открывают страницу входа.'}
        </p>
        <ul className={styles.stack}>
          {backlogItems.map((item) => {
            const href = defenseHref(item.link, signedIn);
            return (
              <li key={item.id}>
                <p>
                  {item.id}. {item.title}
                </p>
                <p>
                  {hoursText(item)}. Спринт {item.sprint}. {item.status}.{' '}
                  <Link to={href}>{screenLabel(item.link)}</Link>
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <MetricsSection />
      <TeamSection />
      <EvidenceLogSection />

      <section
        className={styles.section}
        id="boundaries"
        aria-labelledby="boundaries-title"
      >
        <h2 id="boundaries-title">14. Границы прототипа</h2>
        <p className={styles.prose}>
          Публикация, адрес сайта, DNS, HTTPS, вход и проверка архивов
          имитируются в браузере. Отказ в доступе чужому аккаунту тоже имитация:
          настоящая изоляция аккаунтов, хостинг и сервер в прототип не входят.
        </p>
      </section>
    </article>
  );
}
