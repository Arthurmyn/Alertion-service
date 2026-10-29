import type { DeploymentState } from '../state/types.ts';

export const deploymentLabel: Record<DeploymentState, string> = {
  published: 'Опубликовано',
  publishFailed: 'Ошибка публикации',
  rolledBack: 'Откат выполнен',
  rollbackFailed: 'Ошибка отката',
};

export const deferredDomainLine = 'Домен: недоступно в этой версии прототипа';

export const activeVersionTerm = 'Активная версия';
