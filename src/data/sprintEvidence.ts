import type { BacklogItem, SprintNumber } from './backlogItems.ts';

export const EMPTY_SLOT_LABEL = 'записи нет';

export interface EvidenceSlot {
  sprint: SprintNumber;
  backlogId: BacklogItem['id'];
  check: string;
  title: string;
}

function slot(
  sprint: SprintNumber,
  backlogId: BacklogItem['id'],
  check: string,
  title: string,
): EvidenceSlot {
  return { sprint, backlogId, check, title };
}

export const evidenceSlots: readonly EvidenceSlot[] = [
  slot(1, 'B1', 'public-private', 'Публичная страница и управление разделены'),
  slot(1, 'B1', 'access-denied', 'Чужой аккаунт не видит управление'),
  slot(1, 'B2', 'example-url', 'Загрузка доходит до адреса сайта'),
  slot(1, 'B2', 'missing-index', 'В архиве нет index.html в корне'),
  slot(1, 'B2', 'unsafe-path', 'В архиве небезопасный путь'),
  slot(
    1,
    'B2',
    'over-limit',
    'Размер архива, распаковки или хранилища выше лимита',
  ),
  slot(1, 'B2', 'active-unchanged', 'После отказа активная версия та же'),
  slot(1, 'B3', 'candidate-rule', 'Правило кандидата и активной версии'),
  slot(2, 'B3', 'preview-keeps-a', 'Предпросмотр не сменяет активную версию'),
  slot(2, 'B3', 'publish-confirms', 'Подтверждение публикует новую версию'),
  slot(2, 'B3', 'publish-fails', 'Сбой публикации оставляет прежнюю метку'),
  slot(2, 'B3', 'preview-audience', 'Экран пишет, кто видит предпросмотр'),
  slot(2, 'B4', 'rollback-restores', 'Откат возвращает предыдущую версию'),
  slot(
    2,
    'B4',
    'rollback-none',
    'Без истории откат выключен и причина написана',
  ),
  slot(2, 'B4', 'rollback-fails', 'Сбой отката сохраняет метку версии'),
  slot(
    2,
    'B5',
    'verify-before-activate',
    'Проверка контроля домена раньше активации',
  ),
  slot(2, 'B5', 'pending-vs-failed', 'Ожидание и ошибка объяснены по-разному'),
  slot(2, 'B5', 'example-values', 'Значения домена помечены как пример'),
  slot(3, 'B6', 'dashboard-matches', 'Панель совпадает со сценарием'),
  slot(3, 'B6', 'domain-deferred', 'Отложенный домен подписан как недоступный'),
  slot(
    3,
    'B7',
    'limits-agree',
    'План, загрузка и панель показывают одни лимиты',
  ),
  slot(3, 'B7', 'limit-next-step', 'Отказ называет лимит и следующий шаг'),
  slot(3, 'B8', 'result-links', 'У результата есть ссылка на доказательство'),
  slot(
    3,
    'B8',
    'goals-marked',
    'У каждой цели есть отметка, причина и решение',
  ),
  slot(3, 'B8', 'sprint-record', 'В спринте есть слот на проверку'),
];

export function evidenceFileName(item: EvidenceSlot): string {
  return `s${item.sprint}-${item.backlogId}-${item.check}`;
}
