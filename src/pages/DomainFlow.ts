import { domainExamples } from '../data/accounts.ts';
import type { DomainState } from '../state/types.ts';

export const domainCopy = {
  example: 'пример',
  simulation: 'Проверка DNS и выпуск HTTPS: симуляция.',
  notConnected: 'Домен не подключён.',
  nameForSite: 'Имя для этого сайта:',
  domainName: 'Имя домена:',
  nameLabel: 'Имя домена',
  nameSubmit: 'Указать домен',
  nameRequired: 'Укажите домен.',
  stepsTitle: 'Порядок подключения',
  steps: [
    'Укажите домен.',
    'Добавьте TXT-запись.',
    'Нажмите «Проверить».',
    'Дождитесь подтверждения контроля.',
    'Нажмите «Активировать домен».',
  ],
  txtTitle: 'Запись TXT',
  txtHelp: 'TXT-запись для проверки контроля домена.',
  txtName: 'Имя TXT',
  txtValue: 'Значение TXT',
  pending: 'Запись TXT ещё не видна. Подождите и проверьте снова.',
  failed: 'Значение TXT не совпадает. Исправьте запись и проверьте снова.',
  check: 'Проверить',
  confirmed: 'Контроль подтверждён.',
  confirmedPending:
    'Контроль подтверждён. Домен остаётся в ожидании до активации.',
  activate: 'Активировать домен',
  verifyBlocked: 'Сначала укажите домен.',
  activateBlocked: 'Сначала подтвердите контроль домена.',
  deferred: 'Недоступно в этой версии прототипа',
  cnameTitle: 'Запись CNAME',
  cnameLater: 'После активации направьте имя на адрес сайта.',
  cnameNow: 'Имя направлено на адрес сайта.',
  certTitle: 'Сертификат HTTPS',
  httpsActive: 'HTTPS активен.',
  httpsPending: 'HTTPS ещё не активен.',
  httpsAfterActivate: 'HTTPS выпустится после активации.',
  httpsFailed: 'HTTPS не выпущен.',
  httpsNotStarted: 'HTTPS не выпущен: домен не указан.',
  domainLabel: 'Домен',
  httpsLabel: 'HTTPS',
} as const;

export function ownershipCopy(businessName: string): string {
  return `Домен принадлежит аккаунту сайта «${businessName}». Чужой аккаунт не меняет эти записи.`;
}

export function domainNameError(value: string): string | undefined {
  if (value.trim() === '') return domainCopy.nameRequired;
  return undefined;
}

export interface DnsExamples {
  domainName: string;
  txtName: string;
  txtValue: string;
  cname: string;
  certificate: string;
}

export function dnsExamplesFor(domainName: string): DnsExamples {
  return {
    domainName,
    txtName:
      domainName === domainExamples.cnameName
        ? domainExamples.txtName
        : `_alertion-verify.${domainName}`,
    txtValue: domainExamples.txtValue,
    cname: `${domainName} → ${domainExamples.cnameTarget}`,
    certificate: domainExamples.certificate,
  };
}

export type DomainPhase = 'deferred' | 'name' | 'check' | 'activate' | 'active';

/** Name, then TXT check, then activation. Deferred and active are terminal. */
export function domainPhase(domain: DomainState): DomainPhase {
  if (domain.status === 'deferred') return 'deferred';
  if (domain.status === 'active') return 'active';
  if (domain.controlVerified && domain.status === 'pending') return 'activate';
  if (
    domain.name !== null &&
    (domain.status === 'pending' || domain.status === 'failed')
  ) {
    return 'check';
  }
  return 'name';
}

export function currentStep(domain: DomainState): number | null {
  switch (domainPhase(domain)) {
    case 'name':
      return 0;
    case 'check':
      return 2;
    case 'activate':
      return 4;
    default:
      return null;
  }
}

export function showNameForm(domain: DomainState): boolean {
  return domainPhase(domain) === 'name';
}

export function showVerify(domain: DomainState): boolean {
  const phase = domainPhase(domain);
  return phase !== 'active' && phase !== 'activate';
}

export function verifyEnabled(domain: DomainState): boolean {
  return domainPhase(domain) === 'check';
}

export function showActivate(domain: DomainState): boolean {
  return domainPhase(domain) !== 'active';
}

export function activateEnabled(domain: DomainState): boolean {
  return domainPhase(domain) === 'activate';
}

export function verifyReason(domain: DomainState): string | null {
  if (!showVerify(domain) || verifyEnabled(domain)) return null;
  if (domain.status === 'deferred') return domainCopy.deferred;
  return domainCopy.verifyBlocked;
}

export function activateReason(domain: DomainState): string | null {
  if (!showActivate(domain) || activateEnabled(domain)) return null;
  if (domain.status === 'deferred') return domainCopy.deferred;
  return domainCopy.activateBlocked;
}

export function checkMessage(
  domain: DomainState,
): { tone: 'error' | 'warn'; text: string } | null {
  if (domain.status === 'failed') {
    return { tone: 'error', text: domainCopy.failed };
  }
  if (domain.status === 'pending' && !domain.controlVerified) {
    return { tone: 'warn', text: domainCopy.pending };
  }
  return null;
}

export function confirmation(domain: DomainState): string | null {
  if (!domain.controlVerified) return null;
  if (domain.status === 'pending') return domainCopy.confirmedPending;
  if (domain.status === 'active') return domainCopy.confirmed;
  return null;
}

export function httpsCopy(domain: DomainState): string | null {
  switch (domain.status) {
    case 'active':
      return domainCopy.httpsActive;
    case 'failed':
      return domainCopy.httpsFailed;
    case 'pending':
      return domain.controlVerified
        ? domainCopy.httpsAfterActivate
        : domainCopy.httpsPending;
    case 'notStarted':
      return domainCopy.httpsNotStarted;
    case 'deferred':
      return null;
  }
}

export function cnameCopy(domain: DomainState): string | null {
  if (domain.status === 'deferred') return null;
  return domain.status === 'active'
    ? domainCopy.cnameNow
    : domainCopy.cnameLater;
}

export function shownDomainName(
  domain: DomainState,
  accountDomainName: string,
): string {
  return domain.name ?? accountDomainName;
}

export function nameCaption(domain: DomainState): string {
  return domain.name === null ? domainCopy.nameForSite : domainCopy.domainName;
}
