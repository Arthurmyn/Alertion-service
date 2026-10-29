import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert } from '../components/Alert.tsx';
import { Button } from '../components/Button.tsx';
import { ConfirmDialog } from '../components/ConfirmDialog.tsx';
import { useStore } from '../state/store.tsx';
import { NotFound } from './NotFound.tsx';
import styles from './Versions.module.css';
import {
  activeVersionLine,
  publishButtonLabel,
  publishConfirmText,
  publishFailedLine,
  versionById,
  versionSizeLine,
} from './Versions.copy.ts';

export function PublishDialog({
  activeLabel,
  candidateLabel,
  onConfirm,
  onClose,
}: {
  activeLabel: string;
  candidateLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const label = publishButtonLabel(candidateLabel);
  return (
    <ConfirmDialog
      title={label}
      confirmLabel={label}
      onConfirm={onConfirm}
      onClose={onClose}
    >
      {publishConfirmText(activeLabel, candidateLabel)}
    </ConfirmDialog>
  );
}

export function Versions() {
  const { slug = '' } = useParams();
  const { state, dispatch } = useStore();
  const [confirming, setConfirming] = useState(false);
  const site = state.sites[slug];
  if (!site) return <NotFound />;

  const active = versionById(site, site.activeVersionId);
  const candidate = versionById(site, site.candidateVersionId);

  return (
    <>
      <h1>Версии</h1>
      {active ? (
        <p aria-live="polite">{activeVersionLine(active.label)}</p>
      ) : null}
      {site.deployment === 'publishFailed' && active ? (
        <Alert>{publishFailedLine(active.label)}</Alert>
      ) : null}
      <ul className={styles.list}>
        {site.versions.map((version) => {
          const isActive = version.id === site.activeVersionId;
          const isCandidate = version.id === site.candidateVersionId;
          return (
            <li key={version.id} className={styles.row}>
              <p className={styles.name}>Версия {version.label}</p>
              <p>
                <code>{version.archiveName}</code>
              </p>
              <p className={styles.size}>{versionSizeLine(version)}</p>
              {isActive ? (
                <p className={`${styles.mark} ${styles.active}`}>
                  активная версия
                </p>
              ) : null}
              {isCandidate ? (
                <p className={`${styles.mark} ${styles.candidate}`}>кандидат</p>
              ) : null}
            </li>
          );
        })}
      </ul>
      {candidate ? (
        <div className={styles.actions}>
          <Button onClick={() => setConfirming(true)}>
            {publishButtonLabel(candidate.label)}
          </Button>
        </div>
      ) : null}
      {confirming && candidate && active ? (
        <PublishDialog
          activeLabel={active.label}
          candidateLabel={candidate.label}
          onConfirm={() => {
            dispatch({ type: 'publish', slug });
            setConfirming(false);
          }}
          onClose={() => setConfirming(false)}
        />
      ) : null}
    </>
  );
}
