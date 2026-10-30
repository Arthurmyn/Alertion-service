import { Link } from 'react-router-dom';
import { verificationFor } from '../../data/verification.ts';
import { activeVersion, formatDate, initials } from '../../data/workspace.ts';
import { deploymentLabel } from '../../pages/project/Dashboard.copy.ts';
import { projectPath } from '../../app/routing.ts';
import { exampleUrl } from '../../state/selectors.ts';
import type { Site } from '../../state/types.ts';
import { deploymentTone } from './deploymentTone.ts';
import { IconAttestation, IconDeployments } from '../ui/icons.tsx';
import { StatusBadge, VerificationBadge } from '../ui/StatusBadge.tsx';
import styles from './ProjectCard.module.css';

/** One project, laid out like a Vercel project card. `row` is the compact list form. */
export function ProjectCard({
  site,
  row = false,
}: {
  site: Site;
  row?: boolean;
}) {
  const version = activeVersion(site);
  return (
    <li className={row ? `${styles.card} ${styles.row}` : styles.card}>
      <div className={styles.head}>
        <span className={styles.avatar} aria-hidden="true">
          {initials(site.businessName)}
        </span>
        <div className={styles.titles}>
          <h3 className={styles.title}>
            <Link to={projectPath(site.slug)} className={styles.link}>
              {site.businessName}
            </Link>
          </h3>
          <p className={styles.url}>{exampleUrl(site)}</p>
        </div>
        <StatusBadge tone={deploymentTone(site)}>
          {deploymentLabel[site.deployment]}
        </StatusBadge>
      </div>
      <p className={styles.line}>
        <IconDeployments />
        <span>
          {version
            ? `Версия ${version.label} · ${version.archiveName}`
            : 'Нет развёртываний'}
        </span>
      </p>
      <p className={`${styles.line} ${styles.muted}`}>
        <IconAttestation />
        <span>
          Репозиторий не подключён · обновлён {formatDate(site.lastUpdatedAt)}
        </span>
      </p>
      {version ? (
        <div className={styles.badges}>
          <VerificationBadge status={verificationFor(site, version)} />
        </div>
      ) : null}
    </li>
  );
}
