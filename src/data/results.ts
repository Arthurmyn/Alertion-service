import { ownerOnlyNote } from '../components/layout/ownerCopy.ts';
import {
  criterionEvidence,
  type EvidenceScreenshot,
} from './criterionEvidence.ts';
import {
  statusActive,
  statusFailed,
  statusPending,
} from '../components/ui/statusWords.ts';
import { storageCaption } from '../components/ui/storageText.ts';
import {
  deniedBody,
  deniedLead,
  deniedTitle,
  ownSiteLink,
} from '../pages/AccessDenied.copy.ts';
import {
  activeVersionTerm,
  deferredDomainLine,
  deploymentLabel,
} from '../pages/Dashboard.copy.ts';
import { domainCopy } from '../pages/DomainFlow.ts';
import {
  addSiteButton,
  addSiteNotice,
  siteLimitLine,
} from '../pages/PlanText.ts';
import { publicBoundary, publicHeading } from '../pages/PublicSite.copy.ts';
import {
  limitsSummary,
  openSiteLead,
  successMessage,
} from '../pages/UploadModel.ts';
import {
  activeVersionLine,
  candidateVersionLine,
  confirmChangeText,
  noCandidateLine,
  previewAudience,
  publishConfirmTitle,
  publishFailedLine,
  rollbackAction,
  rollbackButtonLabel,
  rollbackFailedLine,
  rollbackUnavailable,
  uploadArchiveLink,
} from '../pages/Versions.copy.ts';
import { exampleUrl, storageUsedMb } from '../state/selectors.ts';
import type { Site } from '../state/types.ts';
import { accounts, domainExamples } from './accounts.ts';
import { archives } from './archives.ts';
import { dishBaursak } from './sampleSites.ts';
import { LIMITS } from './limits.ts';
import { scenarioById, scenarioState, scenarios } from './scenarios.ts';

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

export interface ResultRow {
  id: string;
  quote: string;
  shown: string;
  scenarioIds: readonly string[];
  href?: string;
  screenshot: EvidenceScreenshot;
}

export type GoalMark = 'отложено' | 'выполнено';

export interface GoalRow {
  id: 'G1' | 'G2' | 'G3' | 'G4' | 'G5';
  quote: string;
  mark: GoalMark;
  reason: string;
  decision: string;
  scenarioId: string | null;
  /** Spec file, shown as text. */
  spec: string | null;
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

function accountOf(id: 'a' | 'b') {
  const found = accounts.find((item) => item.id === id);
  if (!found) throw new Error(id);
  return found;
}

function versionLabel(name: string): string {
  const label = archives[name]?.label;
  if (label === null || label === undefined) throw new Error(name);
  return label;
}

function scenarioSite(id: string): Site {
  const scenario = scenarioById(id);
  if (!scenario?.setup.account) throw new Error(id);
  const owner = accounts.find((item) => item.id === scenario.setup.account);
  const site = owner ? scenarioState(scenario).sites[owner.slug] : undefined;
  if (!site) throw new Error(id);
  return site;
}

function refusal(id: string): string {
  const scenario = scenarioById(id);
  if (!scenario) throw new Error(id);
  const result = scenarioState(scenario).lastResult;
  if (result?.kind !== 'upload' || result.ok) throw new Error(id);
  return result.nextStep;
}

function closingSentence(message: string): string {
  const parts = message.split('. ').filter((part) => part.length > 0);
  const last = parts[parts.length - 1];
  if (!last) throw new Error(message);
  return last.endsWith('.') ? last : `${last}.`;
}

function secondSiteNotice(): string {
  const scenario = scenarioById('second-site');
  if (!scenario) throw new Error('second-site');
  const notice = addSiteNotice(
    scenarioState(scenario).lastResult,
    accountOf('a').businessName,
  );
  if (!notice) throw new Error('second-site');
  return notice;
}

function meterLine(id: string): string {
  const site = scenarioSite(id);
  return storageCaption(storageUsedMb(site), LIMITS.storageMb);
}

function scenarioTitle(id: string): string {
  const title = scenarioById(id)?.title;
  if (!title) throw new Error(id);
  return title;
}

function q(text: string): string {
  return `«${text}»`;
}

function code(text: string): string {
  return `\`${text}\``;
}

const scenarioIds = scenarios.map((item) => item.id);

function starting(prefix: string): readonly string[] {
  return scenarioIds.filter((id) => id.startsWith(prefix));
}

const labelA = versionLabel('nan-v1.zip');
const labelB = versionLabel('nan-v2.zip');
const previewSite = scenarioSite('preview-b');
const previewPassed = successMessage(previewSite);
if (!previewPassed) throw new Error('preview-b');

const rejectIds = scenarioIds.filter((id) => id.startsWith('reject-'));
const unchangedLines: string[] = [];
for (const id of rejectIds) {
  const line = closingSentence(refusal(id));
  if (!line.startsWith('Активная версия не изменилась:')) throw new Error(id);
  if (!unchangedLines.includes(line)) unchangedLines.push(line);
}

const temir = accountOf('b');
const nan = accountOf('a');

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
    screenshot: criterionEvidence(id),
  };
}

export const results: readonly ResultRow[] = [
  row(
    'B1-AC1',
    'Public website content and private management data are clearly distinguished.',
    `${q(publicHeading)} ${code(exampleUrl(scenarioSite('a-home')))}: ${q(publicBoundary)} Управление ${code(`/manage/${nan.slug}`)}: ${q(ownerOnlyNote)}.`,
    ['a-home'],
  ),
  row(
    'B1-AC2',
    "Account B is denied access to account A's management screens.",
    `${q(deniedTitle)}. ${q(`${deniedLead(temir.ownerName)} ${deniedBody}`)} Ссылка: ${ownSiteLink(temir.businessName)}.`,
    ['b-opens-a'],
  ),
  row(
    'B2-AC1',
    'A valid upload reaches the example URL.',
    `${q(previewPassed)} ${q(openSiteLead)} ${code(exampleUrl(previewSite))}.`,
    ['publish-ok'],
  ),
  row('B2-AC2', rejectionQuote, refusal('reject-no-index'), [
    'reject-no-index',
  ]),
  row('B2-AC3', rejectionQuote, refusal('reject-unsafe-path'), [
    'reject-unsafe-path',
  ]),
  row(
    'B2-AC4',
    rejectionQuote,
    [
      refusal('reject-archive-size'),
      refusal('reject-unpacked-size'),
      refusal('reject-storage'),
    ].join(' '),
    ['reject-archive-size', 'reject-unpacked-size', 'reject-storage'],
  ),
  row(
    'B2-AC5',
    'A failed upload keeps the active version unchanged.',
    `Отказы заканчиваются так: ${unchangedLines.map((line) => q(line)).join(' ')}`,
    starting('reject-'),
  ),
  row(
    'B3-AC1',
    'Previewing B leaves A active.',
    `${q(candidateVersionLine(labelB))} ${q(activeVersionLine(labelA))} Если кандидата нет: ${q(noCandidateLine)} ${q(uploadArchiveLink)}.`,
    ['preview-b'],
  ),
  row(
    'B3-AC2',
    publishQuote,
    `${q(publishConfirmTitle(labelB))} ${confirmChangeText(labelA, labelB)}`,
    ['publish-ok'],
  ),
  row('B3-AC3', publishQuote, q(publishFailedLine(labelA)), ['publish-fail']),
  row(
    'B3-AC4',
    'The preview screen explains who can view it.',
    q(previewAudience),
    ['preview-b'],
  ),
  row(
    'B4-AC1',
    'Rolling back after publishing B restores A.',
    `${q(rollbackButtonLabel(labelA))}, подтверждение, снова ${q(activeVersionLine(labelA))}. На публичной странице ${q(dishBaursak)}.`,
    ['rollback-ok'],
  ),
  row(
    'B4-AC2',
    'With no history available, rollback is disabled and the screen explains why.',
    `Кнопка ${q(rollbackAction)} выключена. ${q(rollbackUnavailable)}`,
    ['rollback-none', 'b-home'],
  ),
  row(
    'B4-AC3',
    'A failed rollback preserves the current version label.',
    q(rollbackFailedLine(labelB)),
    ['rollback-fail'],
  ),
  row(
    'B5-AC1',
    'Domain-control verification comes before activation.',
    `${domainCopy.steps.join(' ')} ${q(domainCopy.confirmed)} Кнопка ${q(domainCopy.activate)} до этого выключена: ${q(domainCopy.activateBlocked)}`,
    ['domain-pending', 'domain-active'],
  ),
  row('B5-AC2', domainQuote, `${domainCopy.pending} ${domainCopy.failed}`, [
    'domain-pending',
    'domain-failed',
  ]),
  row(
    'B5-AC3',
    domainQuote,
    `Рядом со значениями написано ${q(domainCopy.example)}: ${code(domainExamples.cnameName)}, ${code(domainExamples.txtName)}, ${code(domainExamples.txtValue)}, ${code(domainExamples.cnameTarget)}, ${code(domainExamples.certificate)}.`,
    starting('domain-'),
  ),
  row(
    'B5-AC4',
    'Section 3.2 describes the smaller version if scope needs to change.',
    'Фраза записана в разделе целей.',
    [],
    '/defense#goals',
  ),
  row(
    'B6-AC1',
    dashboardQuote,
    `Строка ${q(activeVersionTerm)} берётся из состояния сценария.`,
    scenarioIds,
  ),
  row(
    'B6-AC2',
    dashboardQuote,
    `Адрес сайта: ${code(exampleUrl(scenarioSite('a-home')))} и ${code(exampleUrl(scenarioSite('b-home')))}.`,
    scenarioIds,
  ),
  row(
    'B6-AC3',
    dashboardQuote,
    `${q(deploymentLabel.published)}, ${q(deploymentLabel.publishFailed)}, ${q(deploymentLabel.rolledBack)}, ${q(deploymentLabel.rollbackFailed)}.`,
    [...starting('publish-'), ...starting('rollback-')],
  ),
  row(
    'B6-AC4',
    dashboardQuote,
    'Панель и экран домена читают одно состояние домена.',
    starting('domain-'),
  ),
  row(
    'B6-AC5',
    dashboardQuote,
    `${scenarioTitle('a-home')}: ${q(meterLine('a-home'))}. ${scenarioTitle('b-home')}: ${q(meterLine('b-home'))}. ${scenarioTitle('publish-ok')}: ${q(meterLine('publish-ok'))}.`,
    scenarioIds,
  ),
  row(
    'B6-AC6',
    'If domain work is deferred, the dashboard labels it unavailable.',
    q(deferredDomainLine),
    ['domain-deferred'],
  ),
  row(
    'B7-AC1',
    'Plan, upload and dashboard values agree.',
    `На загрузке: ${q(limitsSummary())} На плане: ${q(siteLimitLine())} На панели: ${q(meterLine('a-home'))}.`,
    ['a-home'],
  ),
  row(
    'B7-AC2',
    'The rejection message explains which limit was exceeded and what the owner can do next.',
    `${refusal('reject-archive-size')} ${refusal('reject-unpacked-size')} ${refusal('reject-storage')} Кнопка ${q(addSiteButton)}: ${secondSiteNotice()}`,
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
    spec: null,
  },
  {
    id: 'G2',
    quote:
      'Demonstrate preview with A still active, confirmed publication of B and rollback to A. Failed actions must preserve the current version label.',
    mark: 'выполнено',
    reason: checked,
    decision: `${q(activeVersionLine(labelA))} при предпросмотре версии ${labelB}. ${confirmChangeText(labelA, labelB)} ${q(rollbackButtonLabel(labelA))} возвращает версию ${labelA}. ${q(publishFailedLine(labelA))} ${q(rollbackFailedLine(labelB))}`,
    scenarioId: 'rollback-ok',
    spec: 'e2e/b3-g2.spec.ts и e2e/b4-g2.spec.ts',
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
    spec: 'e2e/b1-g3-access.spec.ts и e2e/b2-g3.spec.ts',
  },
  {
    id: 'G4',
    quote:
      'Distinguish pending, active and failed domain/HTTPS states and explain domain-control verification before activation. If we reduce the scope, we will record which checks remain and which are deferred.',
    mark: 'выполнено',
    reason: checked,
    decision: `${q(statusPending)}, ${q(statusActive)}, ${q(statusFailed)}. ${domainCopy.pending} ${domainCopy.failed} ${q(domainCopy.confirmed)} затем ${q(domainCopy.activate)}.`,
    scenarioId: 'domain-active',
    spec: 'e2e/b5-g4.spec.ts',
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
    spec: null,
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
  if (goal.mark === 'выполнено' && !goal.spec) {
    throw new Error(goal.id);
  }
}
