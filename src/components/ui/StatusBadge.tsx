import type { ReactNode } from 'react';
import { IconAttestation } from './icons.tsx';
import {
  verificationHint,
  verificationLabel,
  type VerificationStatus,
} from '../../data/verification.ts';
import type { VersionRole } from '../../data/workspace.ts';
import type { DeploymentState } from '../../state/types.ts';
import styles from './StatusBadge.module.css';

export type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

/** Deployment state: a dot. Verification state: a shield. The two never share a shape. */
export function StatusBadge({
  tone,
  children,
  title,
}: {
  tone: Tone;
  children: ReactNode;
  title?: string;
}) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`} title={title}>
      <span className={styles.dot} aria-hidden="true" />
      {children}
    </span>
  );
}

const verificationTone: Record<VerificationStatus, Tone> = {
  verified: 'success',
  failed: 'error',
  pending: 'warning',
  unavailable: 'neutral',
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  return (
    <span
      className={`${styles.badge} ${styles.shield} ${styles[verificationTone[status]]}`}
      title={verificationHint[status]}
    >
      <IconAttestation />
      {verificationLabel[status]}
    </span>
  );
}

/** What this version is doing for its site, as a deployment badge. */
export function VersionBadge({
  role,
  deployment,
}: {
  role: VersionRole;
  deployment: DeploymentState;
}) {
  if (role === 'candidate')
    return <StatusBadge tone="info">Кандидат</StatusBadge>;
  if (role === 'previous') {
    return <StatusBadge tone="neutral">Предыдущая</StatusBadge>;
  }
  if (deployment === 'publishFailed' || deployment === 'rollbackFailed') {
    return <StatusBadge tone="error">Ошибка</StatusBadge>;
  }
  return <StatusBadge tone="success">Активна</StatusBadge>;
}
