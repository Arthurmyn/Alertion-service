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
  txtHelp: 'Создайте у регистратора запись TXT и вставьте имя и значение ниже.',
  txtName: 'Имя TXT',
  txtValue: 'Значение TXT',
  pending: 'Запись TXT ещё не видна. Подождите и нажмите «Проверить».',
  failed: 'Значение TXT не совпадает. Исправьте запись и проверьте снова.',
  check: 'Проверить',
  confirmed: 'Контроль подтверждён.',
  confirmedPending:
    'Контроль подтверждён. Домен остаётся в ожидании до активации.',
  activate: 'Активировать домен',
  verifyBlocked: 'Сначала укажите домен.',
  activateBlocked: 'Сначала подтвердите контроль домена.',
  activateAfterFail: 'Сначала исправьте TXT и нажмите «Проверить».',
  deferred: 'Недоступно в этой версии прототипа',
  cnameTitle: 'Запись CNAME',
  cnameHost: 'Имя',
  cnameAddress: 'Адрес',
  cnameLater: 'После активации создайте CNAME с этим именем и адресом.',
  cnameNow: 'Имя уже указывает на адрес ниже.',
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

const HOST_LABEL = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)$/i;

function nameHint(example: string): string {
  return `Напишите имя вроде ${example}.`;
}

export function canonicalDomainName(value: string): string {
  return value.trim().toLowerCase();
}

export function domainNameError(
  value: string,
  example = 'nan.example',
): string | undefined {
  const name = value.trim();
  const hint = nameHint(example);
  if (name === '') return domainCopy.nameRequired;
  if (/\s/u.test(name)) return `В имени есть пробел. ${hint}`;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(name)) {
    return `Уберите http://. Нужно только имя домена. ${hint}`;
  }
  if (/[/?#]/.test(name)) {
    return `Уберите путь. Нужно только имя домена. ${hint}`;
  }
  if (name.includes('@')) return `В имени есть @. ${hint}`;
  if (name.includes(':')) {
    return `Уберите порт. Нужно только имя домена. ${hint}`;
  }
  if (name.length > 253) return `Имя длиннее 253 символов. ${hint}`;
  if (!name.includes('.')) return `В имени нет точки. ${hint}`;
  if (!name.toLowerCase().endsWith('.example')) {
    return `Домен в прототипе заканчивается на .example. ${hint}`;
  }
  const labels = name.split('.');
  if (!labels.every((label) => HOST_LABEL.test(label))) {
    return `«${name}» не является доменным именем. ${hint}`;
  }
  return undefined;
}

export interface DnsExamples {
  domainName: string;
  txtName: string;
  txtValue: string;
  cnameName: string;
  cnameTarget: string;
  certificate: string;
}

export function dnsExamplesFor(domainName: string): DnsExamples {
  const canonical = domainName.toLowerCase();
  return {
    domainName,
    txtName:
      canonical === domainExamples.cnameName
        ? domainExamples.txtName
        : `_alertion-verify.${domainName}`,
    txtValue: domainExamples.txtValue,
    cnameName: domainName,
    cnameTarget: domainExamples.cnameTarget,
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
      return domain.status === 'failed' ? 2 : 1;
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
  if (domain.status === 'failed') return domainCopy.activateAfterFail;
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
