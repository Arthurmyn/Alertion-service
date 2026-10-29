import { archives } from './archives.ts';
import { LIMITS } from './limits.ts';
import { scenarioById, scenarios } from './scenarios.ts';

export const SCREENSHOT_EMPTY = 'скриншота нет';

export const scopeNote =
  'B5 не сокращали; сокращённый вариант из §3.2 не понадобился';

export const scopeVolumeNote = 'Объём не сокращали.';

export const observationMark = 'отложено';

const rejectionQuote =
  'A missing entry page, unsafe path or oversized upload produces a clear rejection message.';

const publishQuote =
  'Confirmation makes B active, while a failed publication keeps A active.';

const domainQuote =
  'Pending and failed states have different explanations, and domain/certificate values are clearly marked as examples.';

const dashboardQuote =
  'The active version, example URL, deployment state, domain state and storage match the scenario.';

const previewAudience =
  'Предпросмотр видите только вы, пока выполнен вход в аккаунт этого сайта. Посетители и другие аккаунты видят активную версию.';

export interface ResultRow {
  id: string;
  quote: string;
  shown: string;
  scenarioIds: readonly string[];
  href?: string;
  screenshot: null;
}

export type GoalMark = 'отложено' | 'выполнено';

export interface GoalRow {
  id: 'G1' | 'G2' | 'G3' | 'G4' | 'G5';
  quote: string;
  mark: GoalMark;
  reason: string;
  decision: string;
  scenarioId: string | null;
}

export interface UnmetRow {
  title: string;
  quote?: string;
  mark: string;
  detail: string;
}

export function scenarioHref(id: string): string {
  const scenario = scenarioById(id);
  if (!scenario) throw new Error(`unknown scenario ${id}`);
  return `${scenario.route}?scenario=${id}`;
}

function unpacked(name: string): number {
  const value = archives[name]?.unpackedMb;
  if (value === null || value === undefined) throw new Error(name);
  return value;
}

function archiveMb(name: string): number {
  const value = archives[name]?.archiveMb;
  if (value === null || value === undefined) throw new Error(name);
  return value;
}

function meter(usedMb: number): string {
  return `${usedMb} МБ из ${LIMITS.storageMb} МБ`;
}

function overLimit(actualMb: number, limitMb: number): string {
  return `${actualMb} МБ больше лимита ${limitMb} МБ`;
}

const scenarioIds = scenarios.map((item) => item.id);

function starting(prefix: string): readonly string[] {
  return scenarioIds.filter((id) => id.startsWith(prefix));
}

const retainedMb = [
  'nan-v1.zip',
  'nan-v2.zip',
  'nan-v3.zip',
  'nan-v4.zip',
].reduce((sum, name) => sum + unpacked(name), 0);

const storageA = unpacked('nan-v1.zip');
const storageB = unpacked('temir-v1.zip');
const storagePublished = storageA + unpacked('nan-v2.zip');
const storageActualMb = retainedMb + unpacked('nan-storage.zip');

function row(
  id: string,
  quote: string,
  shown: string,
  scenarioIdsForRow: readonly string[],
  href?: string,
): ResultRow {
  return {
    id,
    quote,
    shown,
    scenarioIds: scenarioIdsForRow,
    ...(href === undefined ? {} : { href }),
    screenshot: null,
  };
}

export const results: readonly ResultRow[] = [
  row(
    'B1-AC1',
    'Public website content and private management data are clearly distinguished.',
    'Публичная страница `/site/nan` без хранилища, версий и домена. Управление `/manage/nan`: «Управление сайтом, видно только владельцу».',
    ['a-home'],
  ),
  row(
    'B1-AC2',
    "Account B is denied access to account A's management screens.",
    'Темир на `/manage/nan` видит отказ. Данных аккаунта A нет. Ссылка ведёт на `/manage/temir`.',
    ['b-opens-a'],
  ),
  row(
    'B2-AC1',
    'A valid upload reaches the example URL.',
    'Результат загрузки даёт ссылку `/site/nan`. После подтверждения публичная страница показывает версию B.',
    ['publish-ok'],
  ),
  row('B2-AC2', rejectionQuote, '«В архиве нет index.html в корне.»', [
    'reject-no-index',
  ]),
  row('B2-AC3', rejectionQuote, 'В сообщении есть путь `../secret.txt`.', [
    'reject-unsafe-path',
  ]),
  row(
    'B2-AC4',
    rejectionQuote,
    `Архив ${overLimit(archiveMb('nan-28mb.zip'), LIMITS.archiveMb)}. Распаковка ${overLimit(unpacked('nan-unpack-60.zip'), LIMITS.unpackedMb)}. Хранилище ${overLimit(storageActualMb, LIMITS.storageMb)}.`,
    ['reject-archive-size', 'reject-unpacked-size', 'reject-storage'],
  ),
  row(
    'B2-AC5',
    'A failed upload keeps the active version unchanged.',
    'Каждый отказ заканчивается фразой «Активная версия не изменилась: A». На панели та же версия.',
    starting('reject-'),
  ),
  row(
    'B3-AC1',
    'Previewing B leaves A active.',
    'Предпросмотр рисует B. Строка «Активна версия A». Без кандидата экран ведёт на загрузку.',
    ['preview-b'],
  ),
  row(
    'B3-AC2',
    publishQuote,
    'Диалог подтверждения. После него версия B активна на панели и на `/site/nan`.',
    ['publish-ok'],
  ),
  row('B3-AC3', publishQuote, '«Публикация не прошла. Активная версия: A.»', [
    'publish-fail',
  ]),
  row(
    'B3-AC4',
    'The preview screen explains who can view it.',
    `«${previewAudience}»`,
    ['preview-b'],
  ),
  row(
    'B4-AC1',
    'Rolling back after publishing B restores A.',
    '«Вернуть версию A», подтверждение, снова активна A. На публичной странице остаётся баурсак.',
    ['rollback-ok'],
  ),
  row(
    'B4-AC2',
    'With no history available, rollback is disabled and the screen explains why.',
    'Кнопка отката выключена. «Откат недоступен: предыдущей версии нет.»',
    ['rollback-none', 'b-home'],
  ),
  row(
    'B4-AC3',
    'A failed rollback preserves the current version label.',
    '«Откат не прошёл. Активная версия: B.»',
    ['rollback-fail'],
  ),
  row(
    'B5-AC1',
    'Domain-control verification comes before activation.',
    'Имя, TXT, «Проверить», «Контроль подтверждён», затем «Активировать домен».',
    ['domain-pending', 'domain-active'],
  ),
  row(
    'B5-AC2',
    domainQuote,
    'Ожидание: запись ещё не видна, подождать и проверить снова. Ошибка: значение TXT не совпадает, его нужно исправить.',
    ['domain-pending', 'domain-failed'],
  ),
  row(
    'B5-AC3',
    domainQuote,
    'Домен, TXT, CNAME и сертификат подписаны «пример» и лежат в зоне .example.',
    starting('domain-'),
  ),
  row(
    'B5-AC4',
    'Section 3.2 describes the smaller version if scope needs to change.',
    'Запись стоит в разделе целей.',
    [],
    '/defense#goals',
  ),
  row(
    'B6-AC1',
    dashboardQuote,
    'Строка активной версии на панели берётся из состояния сценария.',
    scenarioIds,
  ),
  row(
    'B6-AC2',
    dashboardQuote,
    'Адрес сайта: `/site/nan` или `/site/temir`.',
    scenarioIds,
  ),
  row(
    'B6-AC3',
    dashboardQuote,
    '«Опубликовано», «Ошибка публикации», «Откат выполнен», «Ошибка отката».',
    [...starting('publish-'), ...starting('rollback-')],
  ),
  row(
    'B6-AC4',
    dashboardQuote,
    'Панель и экран домена читают одно и то же состояние.',
    starting('domain-'),
  ),
  row(
    'B6-AC5',
    dashboardQuote,
    `На a-home «${meter(storageA)}». На b-home «${meter(storageB)}». После publish-ok «${meter(storagePublished)}».`,
    scenarioIds,
  ),
  row(
    'B6-AC6',
    'If domain work is deferred, the dashboard labels it unavailable.',
    '«Домен: недоступно в этой версии прототипа»',
    ['domain-deferred'],
  ),
  row(
    'B7-AC1',
    'Plan, upload and dashboard values agree.',
    'План, загрузка и панель берут одни и те же лимиты.',
    ['a-home'],
  ),
  row(
    'B7-AC2',
    'The rejection message explains which limit was exceeded and what the owner can do next.',
    'Отказ по размеру называет лимит, фактический размер и следующий шаг. «Добавить сайт» называет лимит одного сайта.',
    [
      'reject-archive-size',
      'reject-unpacked-size',
      'reject-storage',
      'second-site',
    ],
  ),
];

const checked = 'проверено в прототипе';

export const goals: readonly GoalRow[] = [
  {
    id: 'G1',
    quote:
      'at least four of five team members should complete the upload-to-publication scenario without help.',
    mark: 'отложено',
    reason: 'Проход 5 участников ещё не проводили.',
    decision: 'Отметку запишем после прохода с брифом и листом наблюдений.',
    scenarioId: null,
  },
  {
    id: 'G2',
    quote:
      'Demonstrate preview with A still active, confirmed publication of B and rollback to A. Failed actions must preserve the current version label.',
    mark: 'выполнено',
    reason: checked,
    decision:
      'Предпросмотр оставляет A. Подтверждение публикует B. Откат возвращает A. Сбой сохраняет метку версии.',
    scenarioId: 'rollback-ok',
  },
  {
    id: 'G3',
    quote:
      'Check signed-out access, account-ownership denial, an unsafe upload and an over-limit upload against the expected prototype behavior.',
    mark: 'выполнено',
    reason: checked,
    decision:
      'Проверяются выход, чужой аккаунт, небезопасный путь и архив сверх лимита.',
    scenarioId: 'reject-unsafe-path',
  },
  {
    id: 'G4',
    quote:
      'Distinguish pending, active and failed domain/HTTPS states and explain domain-control verification before activation. If we reduce the scope, we will record which checks remain and which are deferred.',
    mark: 'выполнено',
    reason: checked,
    decision:
      'Ожидание, активное состояние и ошибка различаются. Активация идёт после проверки контроля.',
    scenarioId: 'domain-active',
  },
  {
    id: 'G5',
    quote:
      'At least four of five members should explain the displayed limit and what happens when it is exceeded.',
    mark: 'отложено',
    reason: 'Проход 5 участников ещё не проводили.',
    decision:
      'Отметку запишем, когда 5 участников объяснят лимит и превышение.',
    scenarioId: null,
  },
];

export const unmetRows: readonly UnmetRow[] = [
  {
    title: 'B8-AC3',
    quote:
      'Members capture evidence during each sprint so the final compilation has a complete record.',
    mark: 'не выполнено',
    detail: 'Слоты журнала подписаны, записей по спринтам нет.',
  },
  {
    title: 'Ревью и оставшиеся часы',
    mark: 'вне экрана',
    detail:
      'Нужно ревью другого участника и ежедневная запись оставшихся часов. Это процесс, не экран.',
  },
  {
    title: 'Ротация ролей',
    mark: 'не выполнено',
    detail: 'В бэклоге §4.2 роли закреплены на все 3 спринта.',
  },
  {
    title: 'Отчёт и речи',
    mark: 'вне экрана',
    detail:
      'Ссылки IEEE, оформление отчёта и 5 речей. Это отчёт и слайды, не приложение.',
  },
];

for (const item of results) {
  for (const id of item.scenarioIds) scenarioHref(id);
}

for (const goal of goals) {
  if (goal.scenarioId) scenarioHref(goal.scenarioId);
}
