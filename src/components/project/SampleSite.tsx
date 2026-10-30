import styles from './SampleSite.module.css';

export function SampleSite({ html }: { html: string }) {
  return (
    <iframe
      className={styles.frame}
      title="Страница сайта"
      srcDoc={html}
      sandbox=""
    />
  );
}
