import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
  publishConfirmTitle,
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
  return (
    <ConfirmDialog
      title={publishConfirmTitle(candidateLabel)}
      confirmLabel={publishButtonLabel(candidateLabel)}
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
  const [focusNonce, setFocusNonce] = useState(0);
  const focusKind = useRef<'result' | 'publish'>('result');
  const statusRef = useRef<HTMLParagraphElement>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const site = state.sites[slug];

  useEffect(() => {
    if (focusNonce === 0) return;
    if (focusKind.current === 'publish') {
      actionsRef.current?.querySelector('button')?.focus();
      return;
    }
    (failureRef.current ?? statusRef.current)?.focus();
  }, [focusNonce]);

  if (!site) return <NotFound />;

  const active = versionById(site, site.activeVersionId);
  const candidate = versionById(site, site.candidateVersionId);
  const failed = site.deployment === 'publishFailed' && active;

  return (
    <>
      <h1>Версии</h1>
      {active ? (
        <p ref={statusRef} tabIndex={-1} aria-live="polite">
          {activeVersionLine(active.label)}
        </p>
      ) : null}
      {failed ? (
        <div ref={failureRef} tabIndex={-1}>
          <Alert>{publishFailedLine(active.label)}</Alert>
        </div>
      ) : null}
      <ul className={styles.list}>
        {site.versions.map((version) => {
          const isActive = version.id === site.activeVersionId;
          const isCandidate = version.id === site.candidateVersionId;
          return (
            <li key={version.id} className={styles.row}>
              <div className={styles.head}>
                <p className={styles.name}>Версия {version.label}</p>
                {isActive ? (
                  <p className={`${styles.mark} ${styles.active}`}>
                    активная версия
                  </p>
                ) : null}
                {isCandidate ? (
                  <p className={`${styles.mark} ${styles.candidate}`}>
                    кандидат
                  </p>
                ) : null}
              </div>
              <p className={styles.file}>
                <code>{version.archiveName}</code>
              </p>
              <p className={styles.size}>{versionSizeLine(version)}</p>
            </li>
          );
        })}
      </ul>
      {candidate ? (
        <div className={styles.actions} ref={actionsRef}>
          {confirming ? null : (
            <Button onClick={() => setConfirming(true)}>
              {publishButtonLabel(candidate.label)}
            </Button>
          )}
        </div>
      ) : (
        <p className={styles.note}>
          Кандидата нет.{' '}
          <Link to={`/manage/${slug}/upload`}>Загрузить архив</Link>
        </p>
      )}
      {confirming && candidate && active ? (
        <PublishDialog
          activeLabel={active.label}
          candidateLabel={candidate.label}
          onConfirm={() => {
            focusKind.current = 'result';
            dispatch({ type: 'publish', slug });
            setConfirming(false);
            setFocusNonce((nonce) => nonce + 1);
          }}
          onClose={() => {
            focusKind.current = 'publish';
            setConfirming(false);
            setFocusNonce((nonce) => nonce + 1);
          }}
        />
      ) : null}
    </>
  );
}
