import { DotHands } from './DotHands.tsx';
import {
  appDefense,
  appHome,
  appLogin,
  appSecurity,
  features,
  more,
  navLinks,
  path,
  planFacts,
  steps,
  team,
} from './content.ts';
import { useReveal } from './Reveal.ts';
import styles from './Landing.module.css';

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <a
      href="/"
      className={dark ? `${styles.brand} ${styles.brandDark}` : styles.brand}
      aria-label="Alertion, на главную"
    >
      <img src="/logo.png" alt="" width={26} height={31} />
      <span>Alertion</span>
    </a>
  );
}

function Hero() {
  return (
    <section className={styles.hero} id="top" aria-labelledby="hero-title">
      <DotHands />
      <nav className={styles.nav} aria-label="Разделы страницы">
        <Brand />
        <div className={styles.navLinks}>
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className={styles.navLink}>
              {link.label}
            </a>
          ))}
        </div>
        <a href={appHome} className={styles.signin}>
          Открыть сервис
        </a>
      </nav>

      <div className={styles.copy}>
        <h1 id="hero-title" className={styles.heroTitle}>
          <span className={styles.line1}>Хостинг сайтов,</span>
          <span className={styles.line2}>который можно проверить.</span>
        </h1>
        <p className={styles.subline}>
          Загрузка архива, предпросмотр, подтверждённая публикация и откат.
          Следующий шаг: доказать, что в продакшене именно ваш код.
        </p>
        <div className={styles.cta}>
          <a href={appLogin}>Открыть сервис</a>
        </div>
      </div>

      <div className={styles.facts}>
        <span className={styles.factsLabel}>Пилотный план</span>
        {planFacts.map((fact) => (
          <span key={fact}>{fact}</span>
        ))}
      </div>
    </section>
  );
}

function Heading({
  id,
  first,
  second,
  dark = false,
}: {
  id: string;
  first: string;
  second: string;
  dark?: boolean;
}) {
  return (
    <h2
      id={id}
      className={dark ? `${styles.h2} ${styles.h2Dark}` : styles.h2}
      data-reveal
    >
      <span className={styles.h2Muted}>{first}</span>
      <span>{second}</span>
    </h2>
  );
}

function How() {
  return (
    <section className={styles.section} id="how" aria-labelledby="how-title">
      <div className={styles.inner}>
        <div className={styles.split}>
          <div>
            <Heading
              id="how-title"
              first="От архива до публикации"
              second="за пять шагов."
            />
            <p className={styles.lead} data-reveal>
              Путь, который проходит владелец малого бизнеса. Каждый шаг можно
              проверить в демо на странице защиты проекта.
            </p>
            <ol className={styles.steps}>
              {steps.map((step) => (
                <li key={step.title} data-reveal>
                  <span className={styles.stepTitle}>{step.title}</span>
                  <span className={styles.stepText}>{step.text}</span>
                </li>
              ))}
            </ol>
          </div>
          <figure className={styles.sticky} data-reveal>
            <div className={styles.frame}>
              <img
                src="/landing/shots/publish.png"
                width={1440}
                height={900}
                loading="lazy"
                alt="Диалог «Опубликовать версию B?»: сейчас активна версия A, после подтверждения активной станет версия B."
              />
            </div>
            <figcaption className={styles.caption}>
              Публикация требует подтверждения. До него активная версия не
              меняется.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section
      className={styles.section}
      id="features"
      aria-labelledby="features-title"
    >
      <div className={styles.inner}>
        <Heading
          id="features-title"
          first="Что уже работает"
          second="в прототипе."
        />
        <div className={styles.rows}>
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className={
                index % 2 === 1 ? `${styles.row} ${styles.flip}` : styles.row
              }
              data-reveal
            >
              <div className={styles.rowText}>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                <ul>
                  {feature.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.frame}>
                <img
                  src={feature.image}
                  width={1440}
                  height={900}
                  loading="lazy"
                  alt={feature.alt}
                />
              </div>
            </article>
          ))}
        </div>
        <dl className={styles.more} data-reveal>
          {more.map((item) => (
            <div key={item.term}>
              <dt>{item.term}</dt>
              <dd>{item.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Verify() {
  return (
    <section
      className={`${styles.section} ${styles.inverse}`}
      id="verify"
      aria-labelledby="verify-title"
    >
      <div className={styles.inner}>
        <Heading
          id="verify-title"
          first="Не просто «опубликовано»,"
          second="а «проверено»."
          dark
        />
        <p className={`${styles.lead} ${styles.leadDark}`} data-reveal>
          Идея платформы: подтвердить, что в продакшене работает именно
          проверенный исходный код, сборка и конфигурация. Прототип проходит
          только часть пути, и мы показываем это прямо.
        </p>
        <ol className={styles.path} data-reveal>
          {path.map((item) => (
            <li key={item.step}>
              <span
                className={`${styles.dot} ${styles[`dot_${item.level}`]}`}
                aria-hidden="true"
              />
              <span className={styles.pathStep}>{item.step}</span>
              <span className={styles.pathState}>{item.state}</span>
              <span className={styles.pathNote}>{item.note}</span>
            </li>
          ))}
        </ol>
        <p className={styles.principle} data-reveal>
          Статус «Проверено» не появится, пока нет данных аттестации. Сейчас у
          прототипа нет git, анклава и источника аттестации, поэтому везде
          написано «Проверка недоступна».{' '}
          <a href={appSecurity}>Посмотреть панель безопасности</a>
        </p>
      </div>
    </section>
  );
}

function Team() {
  return (
    <section className={styles.section} id="team" aria-labelledby="team-title">
      <div className={styles.inner}>
        <div className={styles.split}>
          <div>
            <Heading
              id="team-title"
              first="Учебный проект,"
              second="не коммерческий."
            />
            <p className={styles.lead} data-reveal>
              Мы делали Alertion как командный проект по Scrum: цели, результаты
              и журнал доказательств собраны на странице защиты.
            </p>
            <p className={styles.textLink} data-reveal>
              <a href={appDefense}>Страница защиты проекта</a>
            </p>
          </div>
          <dl className={styles.team} data-reveal>
            {team.map((item) => (
              <div key={item.term}>
                <dt>{item.term}</dt>
                <dd>
                  {item.names.map((name) => (
                    <span key={name}>{name}</span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className={styles.closing} aria-labelledby="closing-title">
      <h2 id="closing-title" className={styles.closingTitle} data-reveal>
        Пройдите путь сами.
      </h2>
      <p className={styles.closingText} data-reveal>
        Регистрации нет: два вымышленных аккаунта, пароля нет, всё это
        симуляция.
      </p>
      <div className={`${styles.cta} ${styles.ctaSolo}`} data-reveal>
        <a href={appLogin}>Открыть сервис</a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <Brand />
      <nav aria-label="Ссылки внизу страницы">
        <a href={appHome}>Сервис</a>
        <a href={appDefense}>Защита проекта</a>
        <a href="#top">Наверх</a>
      </nav>
    </footer>
  );
}

export function Landing() {
  useReveal();
  return (
    <>
      <Hero />
      <main>
        <How />
        <Features />
        <Verify />
        <Team />
        <Closing />
      </main>
      <Footer />
    </>
  );
}
