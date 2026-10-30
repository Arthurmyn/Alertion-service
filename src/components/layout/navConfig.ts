import type { ComponentType } from 'react';
import { isWorkspaceSegment } from '../../data/workspace.ts';
import {
  IconAttestation,
  IconBilling,
  IconBuild,
  IconCompute,
  IconConnections,
  IconDefense,
  IconDeployments,
  IconLogs,
  IconNetwork,
  IconObservability,
  IconOverview,
  IconProjects,
  IconReport,
  IconSearch,
  IconSecrets,
  IconSettings,
  IconStorage,
  IconTeam,
} from '../ui/icons.tsx';

export interface NavLeaf {
  to: string;
  label: string;
  Icon: ComponentType;
}

export interface NavSection {
  heading?: string;
  items: NavLeaf[];
}

export interface NavTop {
  id: string;
  label: string;
  Icon: ComponentType;
  /** Where the entry lands. */
  to: string;
  /** Pages that belong to this entry; a section is drilled into when it has some. */
  sections?: NavSection[];
  owns: (pathname: string) => boolean;
}

function startsWithAny(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function inProject(pathname: string): boolean {
  const slug = /^\/manage\/([^/]+)/.exec(pathname)?.[1];
  return slug !== undefined && !isWorkspaceSegment(slug);
}

/** Top level of the sidebar. Entries with `sections` open a second level, like Vercel's. */
export const navTop: readonly NavTop[] = [
  {
    id: 'projects',
    label: 'Проекты',
    Icon: IconProjects,
    to: '/manage',
    owns: (pathname) =>
      pathname === '/manage' ||
      pathname === '/manage/projects' ||
      inProject(pathname),
  },
  {
    id: 'deployments',
    label: 'Развёртывания',
    Icon: IconDeployments,
    to: '/manage/deployments',
    sections: [
      {
        items: [
          { to: '/manage/deployments', label: 'Обзор', Icon: IconOverview },
          {
            to: '/manage/builds',
            label: 'Сборки и исходники',
            Icon: IconBuild,
          },
        ],
      },
    ],
    owns: (pathname) =>
      startsWithAny(pathname, ['/manage/deployments', '/manage/builds']),
  },
  {
    id: 'observability',
    label: 'Наблюдаемость',
    Icon: IconObservability,
    to: '/manage/observability',
    sections: [
      {
        items: [
          { to: '/manage/observability', label: 'Обзор', Icon: IconOverview },
        ],
      },
      {
        heading: 'Исследование',
        items: [
          {
            to: '/manage/observability/logs',
            label: 'Логи',
            Icon: IconLogs,
          },
          {
            to: '/manage/observability/query',
            label: 'Запросы',
            Icon: IconSearch,
          },
        ],
      },
    ],
    owns: (pathname) => startsWithAny(pathname, ['/manage/observability']),
  },
  {
    id: 'security',
    label: 'Безопасность',
    Icon: IconAttestation,
    to: '/manage/security',
    sections: [
      {
        items: [
          { to: '/manage/security', label: 'Панель', Icon: IconOverview },
          {
            to: '/manage/attestations',
            label: 'Аттестации',
            Icon: IconAttestation,
          },
          {
            to: '/manage/reports',
            label: 'Отчёты проверки',
            Icon: IconReport,
          },
        ],
      },
    ],
    owns: (pathname) =>
      startsWithAny(pathname, [
        '/manage/security',
        '/manage/attestations',
        '/manage/reports',
      ]),
  },
  {
    id: 'networking',
    label: 'Сеть',
    Icon: IconNetwork,
    to: '/manage/networking',
    owns: (pathname) => startsWithAny(pathname, ['/manage/networking']),
  },
  {
    id: 'infrastructure',
    label: 'Инфраструктура',
    Icon: IconStorage,
    to: '/manage/storage',
    sections: [
      {
        items: [
          { to: '/manage/storage', label: 'Хранилище', Icon: IconStorage },
          { to: '/manage/compute', label: 'Вычисления', Icon: IconCompute },
          { to: '/manage/secrets', label: 'Секреты', Icon: IconSecrets },
        ],
      },
    ],
    owns: (pathname) =>
      startsWithAny(pathname, [
        '/manage/storage',
        '/manage/compute',
        '/manage/secrets',
      ]),
  },
  {
    id: 'connections',
    label: 'Подключения',
    Icon: IconConnections,
    to: '/manage/connections',
    owns: (pathname) => startsWithAny(pathname, ['/manage/connections']),
  },
  {
    id: 'billing',
    label: 'Биллинг',
    Icon: IconBilling,
    to: '/manage/billing',
    owns: (pathname) => startsWithAny(pathname, ['/manage/billing']),
  },
  {
    id: 'settings',
    label: 'Настройки',
    Icon: IconSettings,
    to: '/manage/settings',
    sections: [
      {
        items: [
          { to: '/manage/settings', label: 'Общие', Icon: IconSettings },
          { to: '/manage/team', label: 'Команда и доступ', Icon: IconTeam },
        ],
      },
    ],
    owns: (pathname) =>
      startsWithAny(pathname, ['/manage/settings', '/manage/team']),
  },
  {
    id: 'defense',
    label: 'Защита проекта',
    Icon: IconDefense,
    to: '/defense',
    owns: (pathname) => pathname === '/defense',
  },
];

export function activeTop(pathname: string): NavTop | undefined {
  return navTop.find((entry) => entry.owns(pathname));
}

/** Every page a Find query can reach. */
export function allLeaves(): NavLeaf[] {
  return navTop.flatMap((entry) =>
    entry.sections
      ? entry.sections.flatMap((section) => section.items)
      : [{ to: entry.to, label: entry.label, Icon: entry.Icon }],
  );
}

/** Centre title of the top bar. Only the workspace overview has one; other pages carry their own heading. */
export function titleFor(pathname: string): string {
  return pathname === '/manage' || pathname === '/manage/projects'
    ? 'Обзор пространства'
    : '';
}
