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

export function IconDashboard() {
  return (
    <Icon>
      <rect x="2" y="2" width="12" height="12" />
      <path d="M2 5.5h12" />
      <path d="M4.5 8h3.5" />
      <path d="M4.5 10.5h6" />
    </Icon>
  );
}

export function IconUpload() {
  return (
    <Icon>
      <path d="M8 2.25v6.5" />
      <path d="M5.25 5 8 2.25 10.75 5" />
      <path d="M3 10.25V13.5h10V10.25" />
    </Icon>
  );
}

export function IconPreview() {
  return (
    <Icon>
      <path d="M4 2h5.5L13 5.5V14H4z" />
      <path d="M9.5 2v3.5H13" />
      <path d="M6.25 8.5h4.5" />
      <path d="M6.25 11h2.75" />
    </Icon>
  );
}

export function IconVersions() {
  return (
    <Icon>
      <rect x="4.5" y="2" width="9" height="9.5" />
      <path d="M3.5 5H2.75V14h8.5" />
    </Icon>
  );
}

export function IconDomain() {
  return (
    <Icon>
      <circle cx="8" cy="8" r="5.25" />
      <path d="M2.75 8h10.5" />
      <path d="M8 2.75c1.6 1.5 2.4 3.2 2.4 5.25S9.6 11.75 8 13.25C6.4 11.75 5.6 10.05 5.6 8S6.4 4.25 8 2.75" />
    </Icon>
  );
}

export function IconPlan() {
  return (
    <Icon>
      <rect x="2.25" y="2.25" width="11.5" height="11.5" />
      <path d="M2.25 6h11.5M2.25 9.75h11.5M7.25 2.25v11.5" />
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
