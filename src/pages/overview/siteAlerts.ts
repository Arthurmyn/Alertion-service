import { projectPath } from '../../app/routing.ts';
import type { Site } from '../../state/types.ts';

export interface SiteAlert {
  key: string;
  tone: 'warning' | 'error';
  title: string;
  project: string;
  to: string;
  action: string;
}

/** Alerts come from the states a project is actually in; nothing is invented. */
export function siteAlerts(sites: readonly Site[]): SiteAlert[] {
  return sites.flatMap((site) => {
    const found: SiteAlert[] = [];
    if (site.storageDataStatus === 'stale') {
      found.push({
        key: `${site.slug}-stale`,
        tone: 'warning',
        title: 'Данные хранилища устарели',
        project: site.businessName,
        to: projectPath(site.slug),
        action: 'Обновить',
      });
    }
    if (site.deployment === 'publishFailed') {
      found.push({
        key: `${site.slug}-publish`,
        tone: 'error',
        title: 'Публикация не прошла',
        project: site.businessName,
        to: projectPath(site.slug, '/versions'),
        action: 'Открыть версии',
      });
    }
    if (site.deployment === 'rollbackFailed') {
      found.push({
        key: `${site.slug}-rollback`,
        tone: 'error',
        title: 'Откат не прошёл',
        project: site.businessName,
        to: projectPath(site.slug, '/versions'),
        action: 'Открыть версии',
      });
    }
    if (site.domain.status === 'failed') {
      found.push({
        key: `${site.slug}-domain`,
        tone: 'error',
        title: 'Домен не прошёл проверку',
        project: site.businessName,
        to: projectPath(site.slug, '/domain'),
        action: 'Исправить запись',
      });
    }
    return found;
  });
}
