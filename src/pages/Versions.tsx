import { useEffect, useId, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert } from '../components/Alert.tsx';
import { Button } from '../components/Button.tsx';
import { ConfirmDialog } from '../components/ConfirmDialog.tsx';
import { useStore } from '../state/store.tsx';
import { NotFound } from './NotFound.tsx';
import styles from './Versions.module.css';
import {
  activeVersionLine,
  confirmChangeText,
  publishButtonLabel,
  publishConfirmTitle,
  publishFailedLine,
  rollbackAction,
  rollbackButtonLabel,
  rollbackConfirmTitle,
  rollbackFailedLine,
  rollbackUnavailable,
  rollbackVersion,
  versionById,
  versionSizeLine,
} from './Versions.copy.ts';

type Pending = 'publish' | 'rollback';

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
      {confirmChangeText(activeLabel, candidateLabel)}
    </ConfirmDialog>
  );
}

export function RollbackDialog({
  activeLabel,
  previousLabel,
  onConfirm,
  onClose,
}: {
  activeLabel: string;
  previousLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <ConfirmDialog
      title={rollbackConfirmTitle(previousLabel)}
      confirmLabel={rollbackButtonLabel(previousLabel)}
      onConfirm={onConfirm}
      onClose={onClose}
    >
      {confirmChangeText(activeLabel, previousLabel)}
    </ConfirmDialog>
  );
}

export function Versions() {
  const { slug = '' } = useParams();
  const { state, dispatch } = useStore();
  const [pending, setPending] = useState<Pending | null>(null);
  const [focusNonce, setFocusNonce] = useState(0);
  const focusKind = useRef<'result' | Pending>('result');
  const statusRef = useRef<HTMLParagraphElement>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const rollbackReasonId = useId();
  const site = state.sites[slug];

  useEffect(() => {
    if (focusNonce === 0) return;
    if (focusKind.current === 'publish' || focusKind.current === 'rollback') {
      const target = actionsRef.current?.querySelector(
        `[data-action="${focusKind.current}"] button`,
      );
      if (target instanceof HTMLElement) target.focus({ focusVisible: true });
      return;
    }
    (failureRef.current ?? statusRef.current)?.focus({ focusVisible: true });
  }, [focusNonce]);

  if (!site) return <NotFound />;

  const active = versionById(site, site.activeVersionId);
  const candidate = versionById(site, site.candidateVersionId);
  const previous = versionById(site, site.previousActiveId);
  const failure =
    site.deployment === 'publishFailed' && active
      ? publishFailedLine(active.label)
      : site.deployment === 'rollbackFailed' && active
        ? rollbackFailedLine(active.label)
        : null;

  const finish = (kind: 'result' | Pending) => {
    focusKind.current = kind;
    setPending(null);
    setFocusNonce((nonce) => nonce + 1);
  };

  return (
    <>
      <h1>Версии</h1>
      {active ? (
        <p
          ref={statusRef}
          className={styles.status}
          tabIndex={-1}
          aria-live="polite"
        >
          {activeVersionLine(active.label)}
        </p>
      ) : null}
      {failure ? (
        <div ref={failureRef} tabIndex={-1}>
          <Alert>{failure}</Alert>
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
      <div className={styles.actions} ref={actionsRef}>
        {pending === null && candidate ? (
          <div data-action="publish">
            <Button onClick={() => setPending('publish')}>
              {publishButtonLabel(candidate.label)}
            </Button>
          </div>
        ) : null}
        {pending === null && previous && active ? (
          <div data-action="rollback">
            <Button onClick={() => setPending('rollback')}>
              {rollbackButtonLabel(previous.label)}
            </Button>
          </div>
        ) : null}
        {pending === null && !previous ? (
          <div className={styles.rollback}>
            <Button disabled describedBy={rollbackReasonId}>
              {rollbackAction}
            </Button>
            <p id={rollbackReasonId} className={styles.reason}>
              {rollbackUnavailable}
            </p>
          </div>
        ) : null}
      </div>
      {pending === null && !candidate ? (
        <p className={styles.note}>
          Кандидата нет.{' '}
          <Link to={`/manage/${slug}/upload`}>Загрузить архив</Link>
        </p>
      ) : null}
      {pending === 'publish' && candidate && active ? (
        <PublishDialog
          activeLabel={active.label}
          candidateLabel={candidate.label}
          onConfirm={() => {
            dispatch({ type: 'publish', slug });
            finish('result');
          }}
          onClose={() => finish('publish')}
        />
      ) : null}
      {pending === 'rollback' && previous && active ? (
        <RollbackDialog
          activeLabel={active.label}
          previousLabel={previous.label}
          onConfirm={() => {
            dispatch(rollbackVersion(slug));
            finish('result');
          }}
          onClose={() => finish('rollback')}
        />
      ) : null}
    </>
  );
}
