import { Link } from 'react-router-dom';
import { IconCheck } from '../../components/ui/icons.tsx';
import { PageHeader } from '../../components/ui/PageHeader.tsx';
import { LinkButton } from '../../components/ui/LinkButton.tsx';
import { StatusBadge } from '../../components/ui/StatusBadge.tsx';
import styles from './Security.module.css';

type Level = 'high' | 'medium' | 'done';

interface Check {
  level: Level;
  title: string;
  text: string;
  to: string;
  action: string;
}

/**
 * What the prototype does and does not guarantee. "done" lists only behaviour
 * that exists in this interface; nothing here is a measured result.
 */
const sections: readonly { title: string; checks: Check[] }[] = [
  {
    title: 'Аккаунт и доступ',
    checks: [
      {
        level: 'high',
        title: 'Вход без пароля',
        text: 'Аккаунт выбирается из списка: пароля и второго фактора нет. Это симуляция входа.',
        to: '/login',
        action: 'Открыть вход',
      },
      {
        level: 'done',
        title: 'Страницы управления закрыты от чужого аккаунта',
        text: 'Другой владелец видит отказ. Проверка выполняется в браузере и не заменяет серверную.',
        to: '/manage/team',
        action: 'Команда и доступ',
      },
      {
        level: 'medium',
        title: 'Двухфакторная защита недоступна',
        text: 'Роли, приглашения и журнал доступа не реализованы.',
        to: '/manage/team',
        action: 'Команда и доступ',
      },
    ],
  },
  {
    title: 'Исходный код и сборка',
    checks: [
      {
        level: 'high',
        title: 'Репозиторий не подключён',
        text: 'Платформа принимает готовый архив, поэтому коммит и ветка развёртывания неизвестны.',
        to: '/manage/connections',
        action: 'Подключения',
      },
      {
        level: 'medium',
        title: 'Сборка не воспроизводима',
        text: 'Архив не собирается из исходников, повторной сборки и сравнения нет.',
        to: '/manage/builds',
        action: 'Сборки и исходники',
      },
    ],
  },
  {
    title: 'Развёртывания и проверка',
    checks: [
      {
        level: 'high',
        title: 'Аттестации не поступают',
        text: 'Нет анклава, который их выпускает, поэтому результат проверки неизвестен.',
        to: '/manage/attestations',
        action: 'Аттестации',
      },
      {
        level: 'done',
        title: 'Архив проверяется при загрузке',
        text: 'Размер, index.html в корне, небезопасные пути и лимиты хранилища.',
        to: '/manage/billing',
        action: 'Лимиты плана',
      },
      {
        level: 'done',
        title: 'Публикация и откат требуют подтверждения',
        text: 'Активная версия меняется только после подтверждения в диалоге.',
        to: '/manage/deployments',
        action: 'Развёртывания',
      },
    ],
  },
];

const levelLabel = { high: 'Высокий', medium: 'Средний' } as const;

export function Security() {
  const all = sections.flatMap((section) => section.checks);
  const count = (level: Level) =>
    all.filter((check) => check.level === level).length;
  const high = count('high');
  const medium = count('medium');
  const done = count('done');
  const open = high + medium;

  return (
    <>
      <PageHeader title="Панель безопасности" />
      <section className={styles.posture} aria-label="Сводка">
        <div
          className={styles.bar}
          role="img"
          aria-label={`Не выполнено с высоким риском: ${high}, со средним: ${medium}, выполнено: ${done}`}
        >
          <span className={styles.high} style={{ flexGrow: high }} />
          <span className={styles.medium} style={{ flexGrow: medium }} />
          <span className={styles.done} style={{ flexGrow: done }} />
        </div>
        <h2 className={styles.summary}>
          Не выполнено {open} из {all.length} проверок
        </h2>
        <p className={styles.lead}>
          Высокий риск: {high}, средний: {medium}. Выполнено: {done}. Список
          показывает, чего не хватает прототипу до проверяемого запуска.
        </p>
      </section>
      {sections.map((section, index) => (
        <section
          key={section.title}
          className={styles.section}
          aria-labelledby={`security-${index}`}
        >
          <h2 id={`security-${index}`}>{section.title}</h2>
          <ul className={styles.cards}>
            {section.checks.map((check) => (
              <li key={check.title} className={styles.card}>
                {check.level === 'done' ? (
                  <span className={styles.tick}>
                    <IconCheck />
                    <span className="visually-hidden">Выполнено</span>
                  </span>
                ) : (
                  <StatusBadge
                    tone={check.level === 'high' ? 'error' : 'warning'}
                  >
                    {levelLabel[check.level]}
                  </StatusBadge>
                )}
                <h3>{check.title}</h3>
                <p>{check.text}</p>
                <div className={styles.action}>
                  {check.level === 'done' ? (
                    <Link to={check.to}>{check.action}</Link>
                  ) : (
                    <LinkButton to={check.to} variant="secondary">
                      {check.action}
                    </LinkButton>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
