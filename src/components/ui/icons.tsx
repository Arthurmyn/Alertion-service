import type { ReactNode } from 'react';
import styles from './icons.module.css';

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function IconSignIn() {
  return (
    <Icon>
      <rect x="2" y="2.5" width="6.5" height="11" />
      <path d="M10 8h4" />
      <path d="M12.25 5.75 14.5 8l-2.25 2.25" />
    </Icon>
  );
}

export function IconDefense() {
  return (
    <Icon>
      <path d="M3.5 2h6L13 5.5V14h-9.5z" />
      <path d="M9.5 2v3.5H13" />
      <path d="M8 6.5V14" />
    </Icon>
  );
}

export function IconCollapse() {
  return (
    <Icon>
      <rect x="1.75" y="2.75" width="12.5" height="10.5" />
      <path d="M6 2.75v10.5" />
      <path d="M11 6.25 8.75 8 11 9.75" />
    </Icon>
  );
}

export function IconExpand() {
  return (
    <Icon>
      <rect x="1.75" y="2.75" width="12.5" height="10.5" />
      <path d="M6 2.75v10.5" />
      <path d="M8.5 6.25 10.75 8 8.5 9.75" />
    </Icon>
  );
}

export function IconMenu() {
  return (
    <Icon>
      <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
    </Icon>
  );
}

export function IconOverview() {
  return (
    <Icon>
      <rect x="2" y="2" width="5" height="6" rx="1" />
      <rect x="9" y="2" width="5" height="3.5" rx="1" />
      <rect x="9" y="7.5" width="5" height="6.5" rx="1" />
      <rect x="2" y="10" width="5" height="4" rx="1" />
    </Icon>
  );
}

export function IconProjects() {
  return (
    <Icon>
      <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.6l1.4 1.5h5A1.5 1.5 0 0 1 14 6v5.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.5z" />
    </Icon>
  );
}

export function IconDeployments() {
  return (
    <Icon>
      <path d="M8 2 13.5 5v6L8 14 2.5 11V5z" />
      <path d="M2.5 5 8 8l5.5-3" />
      <path d="M8 8v6" />
    </Icon>
  );
}

export function IconCompute() {
  return (
    <Icon>
      <rect x="4" y="4" width="8" height="8" rx="1" />
      <path d="M6.5 1.5v2.5M9.5 1.5v2.5M6.5 12v2.5M9.5 12v2.5M1.5 6.5H4M1.5 9.5H4M12 6.5h2.5M12 9.5h2.5" />
    </Icon>
  );
}

export function IconAttestation() {
  return (
    <Icon>
      <path d="M8 1.75 13 3.5v4c0 3-2.1 5.2-5 6.75C5.1 12.7 3 10.5 3 7.5v-4z" />
      <path d="m5.75 8 1.6 1.6L10.5 6.4" />
    </Icon>
  );
}

export function IconBuild() {
  return (
    <Icon>
      <circle cx="4.5" cy="3.5" r="1.5" />
      <circle cx="4.5" cy="12.5" r="1.5" />
      <circle cx="11.5" cy="6.5" r="1.5" />
      <path d="M4.5 5v6M11.5 8v.5a2 2 0 0 1-2 2H6" />
    </Icon>
  );
}

export function IconReport() {
  return (
    <Icon>
      <path d="M4 1.75h5.5L12.5 4.75v9.5H4z" />
      <path d="M9.5 1.75v3h3" />
      <path d="M6 8.5h4.5M6 11h4.5" />
    </Icon>
  );
}

export function IconNetwork() {
  return (
    <Icon>
      <circle cx="8" cy="8" r="6" />
      <path d="M2 8h12" />
      <path d="M8 2c1.8 1.7 2.6 3.7 2.6 6S9.8 12.3 8 14c-1.8-1.7-2.6-3.7-2.6-6S6.2 3.7 8 2z" />
    </Icon>
  );
}

export function IconSecrets() {
  return (
    <Icon>
      <rect x="3" y="7" width="10" height="7" rx="1.2" />
      <path d="M5.25 7V5a2.75 2.75 0 0 1 5.5 0v2" />
    </Icon>
  );
}

export function IconObservability() {
  return (
    <Icon>
      <path d="M2 13.5V2.5" />
      <path d="M2 13.5h12" />
      <path d="m4.5 10 2.5-3 2 2 3.5-4.5" />
    </Icon>
  );
}

export function IconTeam() {
  return (
    <Icon>
      <circle cx="6" cy="5.5" r="2.25" />
      <path d="M1.75 13.5c.3-2.2 2-3.5 4.25-3.5s3.95 1.3 4.25 3.5" />
      <path d="M10.5 3.5a2.25 2.25 0 0 1 0 4.25M12 10.3c1.2.5 2 1.5 2.25 3.2" />
    </Icon>
  );
}

export function IconBilling() {
  return (
    <Icon>
      <rect x="1.75" y="3.5" width="12.5" height="9" rx="1.5" />
      <path d="M1.75 6.75h12.5M4.25 10h2.5" />
    </Icon>
  );
}

export function IconSettings() {
  return (
    <Icon>
      <path d="M2 4.5h6M11 4.5h3M2 11.5h3M8 11.5h6" />
      <circle cx="9.5" cy="4.5" r="1.5" />
      <circle cx="6.5" cy="11.5" r="1.5" />
    </Icon>
  );
}

export function IconChevronsUpDown() {
  return (
    <Icon>
      <path d="m5 6 3-3 3 3M5 10l3 3 3-3" />
    </Icon>
  );
}

export function IconPlus() {
  return (
    <Icon>
      <path d="M8 3v10M3 8h10" />
    </Icon>
  );
}

export function IconSearch() {
  return (
    <Icon>
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3 3" />
    </Icon>
  );
}

export function IconLogs() {
  return (
    <Icon>
      <rect x="2" y="2.5" width="12" height="11" rx="1.5" />
      <path d="m4.75 6 1.75 1.5-1.75 1.5M8 10.5h3" />
    </Icon>
  );
}

export function IconStorage() {
  return (
    <Icon>
      <ellipse cx="8" cy="4" rx="5" ry="2" />
      <path d="M3 4v8c0 1.1 2.2 2 5 2s5-.9 5-2V4" />
      <path d="M3 8c0 1.1 2.2 2 5 2s5-.9 5-2" />
    </Icon>
  );
}

export function IconConnections() {
  return (
    <Icon>
      <path d="M6.5 9.5a2.5 2.5 0 0 0 3.5 0l2.5-2.5a2.5 2.5 0 0 0-3.5-3.5l-.75.75" />
      <path d="M9.5 6.5a2.5 2.5 0 0 0-3.5 0L3.5 9a2.5 2.5 0 0 0 3.5 3.5l.75-.75" />
    </Icon>
  );
}

export function IconChevronRight() {
  return (
    <Icon>
      <path d="m6 4 4 4-4 4" />
    </Icon>
  );
}

export function IconChevronLeft() {
  return (
    <Icon>
      <path d="m10 4-4 4 4 4" />
    </Icon>
  );
}

export function IconMore() {
  return (
    <Icon>
      <circle cx="3.5" cy="8" r="0.9" fill="currentColor" />
      <circle cx="8" cy="8" r="0.9" fill="currentColor" />
      <circle cx="12.5" cy="8" r="0.9" fill="currentColor" />
    </Icon>
  );
}

export function IconGrid() {
  return (
    <Icon>
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </Icon>
  );
}

export function IconList() {
  return (
    <Icon>
      <path d="M5.5 4h8M5.5 8h8M5.5 12h8" />
      <circle cx="2.5" cy="4" r="0.6" fill="currentColor" />
      <circle cx="2.5" cy="8" r="0.6" fill="currentColor" />
      <circle cx="2.5" cy="12" r="0.6" fill="currentColor" />
    </Icon>
  );
}

export function IconFilter() {
  return (
    <Icon>
      <path d="M2 4h12M4 8h8M6.5 12h3" />
    </Icon>
  );
}

export function IconCheck() {
  return (
    <Icon>
      <path d="m3.5 8.5 3 3 6-7" />
    </Icon>
  );
}

export function IconBell() {
  return (
    <Icon>
      <path d="M4 11V7a4 4 0 0 1 8 0v4l1 1.5H3z" />
      <path d="M6.5 14a1.6 1.6 0 0 0 3 0" />
    </Icon>
  );
}

export function IconClose() {
  return (
    <Icon>
      <path d="m4 4 8 8M12 4l-8 8" />
    </Icon>
  );
}
