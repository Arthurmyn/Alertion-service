import { AlertField } from './AlertField.tsx';
import { DotHands } from './DotHands.tsx';
import {
  anchors,
  appDefense,
  appHome,
  appLogin,
  appSecurity,
  locales,
  type Locale,
} from './content.ts';
import { useLocale } from './locale.ts';
import { useReveal } from './Reveal.ts';
import {
  ChecksModel,
  PublishModel,
  RiskModel,
  UsageModel,
} from './Visuals.tsx';
import styles from './Landing.module.css';

const localeNames: Record<Locale, string> = { ru: 'RU', en: 'EN' };
const localeWords: Record<Locale, string> = { ru: 'Русский', en: 'English' };

function LanguageSwitch() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div className={styles.lang} role="group" aria-label={t.languageLabel}>
      {locales.map((item) => (
        <button
          key={item}
          type="button"
          lang={item}
          className={styles.langButton}
          aria-pressed={item === locale}
          aria-label={localeWords[item]}
          onClick={() => setLocale(item)}
        >
          {localeNames[item]}
        </button>
      ))}
    </div>
  );
}

function Brand({ dark = false }: { dark?: boolean }) {
  const { t } = useLocale();
  return (
    <a
      href="/"
      className={dark ? `${styles.brand} ${styles.brandDark}` : styles.brand}
      aria-label={t.brandLabel}
    >
      <img src="/logo.png" alt="" width={26} height={31} />
      <span>Alertion</span>
    </a>
  );
}

function Hero() {
  const { t } = useLocale();
  return (
    <section className={styles.hero} id="top" aria-labelledby="hero-title">
      <DotHands />
      <AlertField variant="hero" />
      <nav className={styles.nav} aria-label={t.navLabel}>
        <Brand />
        <div className={styles.navLinks}>
          {anchors.map((href, index) => (
            <a key={href} href={href} className={styles.navLink}>
              {t.nav[index]}
            </a>
          ))}
        </div>
        <LanguageSwitch />
        <a href={appHome} className={styles.signin}>
          {t.open}
        </a>
      </nav>

      <div className={styles.copy}>
        <h1 id="hero-title" className={styles.heroTitle}>
          <span className={styles.line1}>{t.hero.line1}</span>
          <span className={styles.line2}>{t.hero.line2}</span>
        </h1>
        <p className={styles.subline}>{t.hero.subline}</p>
        <div className={styles.cta}>
          <a href={appLogin}>{t.open}</a>
        </div>
      </div>

      <div className={styles.facts}>
        <span className={styles.factsLabel}>{t.planLabel}</span>
        {t.planFacts.map((fact) => (
          <span key={fact}>{fact}</span>
        ))}
      </div>
    </section>
  );
}

function Heading({
  id,
  heading,
  dark = false,
}: {
  id: string;
  heading: { first: string; second: string };
  dark?: boolean;
}) {
  return (
    <h2
      id={id}
      className={dark ? `${styles.h2} ${styles.h2Dark}` : styles.h2}
      data-reveal
    >
      <span className={styles.h2Muted}>{heading.first}</span>
      <span>{heading.second}</span>
    </h2>
  );
}

function How() {
  const { t } = useLocale();
  return (
    <section className={styles.section} id="how" aria-labelledby="how-title">
      <div className={styles.inner}>
        <div className={styles.split}>
          <div>
            <Heading id="how-title" heading={t.how.heading} />
            <p className={styles.lead} data-reveal>
              {t.how.lead}
            </p>
            <ol className={styles.steps}>
              {t.how.steps.map((step) => (
                <li key={step.title} data-reveal>
                  <span className={styles.stepTitle}>{step.title}</span>
                  <span className={styles.stepText}>{step.text}</span>
                </li>
              ))}
            </ol>
          </div>
          <figure className={styles.sticky} data-reveal>
            <PublishModel />
            <figcaption className={styles.caption}>
              {t.publish.caption}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

function Model({ index }: { index: number }) {
  if (index === 0) return <ChecksModel />;
  if (index === 1) return <UsageModel />;
  return <RiskModel />;
}

function Features() {
  const { t } = useLocale();
  return (
    <section
      className={styles.section}
      id="features"
      aria-labelledby="features-title"
    >
      <div className={styles.inner}>
        <Heading id="features-title" heading={t.features.heading} />
        <div className={styles.rows}>
          {t.features.items.map((feature, index) => (
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
              <div className={styles.model}>
                <Model index={index} />
              </div>
            </article>
          ))}
        </div>
        <dl className={styles.more} data-reveal>
          {t.features.more.map((item) => (
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
  const { t } = useLocale();
  return (
    <section
      className={`${styles.section} ${styles.inverse}`}
      id="verify"
      aria-labelledby="verify-title"
    >
      <div className={styles.inner}>
        <Heading id="verify-title" heading={t.verify.heading} dark />
        <p className={`${styles.lead} ${styles.leadDark}`} data-reveal>
          {t.verify.lead}
        </p>
        <ol className={styles.path} data-reveal>
          {t.verify.path.map((item) => (
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
          {t.verify.principle} <a href={appSecurity}>{t.verify.link}</a>
        </p>
      </div>
    </section>
  );
}

function Team() {
  const { t } = useLocale();
  return (
    <section className={styles.section} id="team" aria-labelledby="team-title">
      <div className={styles.inner}>
        <div className={styles.split}>
          <div>
            <Heading id="team-title" heading={t.team.heading} />
            <p className={styles.lead} data-reveal>
              {t.team.lead}
            </p>
            <p className={styles.textLink} data-reveal>
              <a href={appDefense}>{t.team.link}</a>
            </p>
          </div>
          <dl className={styles.team} data-reveal>
            {t.team.rows.map((item) => (
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
  const { t } = useLocale();
  return (
    <section className={styles.closing} aria-labelledby="closing-title">
      <AlertField variant="closing" />
      <h2 id="closing-title" className={styles.closingTitle} data-reveal>
        {t.closing.title}
      </h2>
      <p className={styles.closingText} data-reveal>
        {t.closing.text}
      </p>
      <div className={`${styles.cta} ${styles.ctaSolo}`} data-reveal>
        <a href={appLogin}>{t.open}</a>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useLocale();
  return (
    <footer className={styles.footer}>
      <Brand />
      <nav aria-label={t.footerNavLabel}>
        <a href={appHome}>{t.footer.service}</a>
        <a href={appDefense}>{t.footer.defense}</a>
        <a href="#top">{t.footer.top}</a>
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
