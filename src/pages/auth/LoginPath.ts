import { homePath } from '../../app/routing.ts';
import type { AccountId } from '../../state/types.ts';

export function safeNext(value: string | null): string | null {
  if (value === null || value === '') return null;
  if (!value.startsWith('/')) return null;
  if (value.startsWith('//') || value.startsWith('/\\')) return null;
  if (value.includes('\\') || value.includes('://')) return null;
  if (/\s/.test(value)) return null;
  return value;
}

export function manageNext(next: string | null): string | null {
  const target = safeNext(next);
  if (target !== null && target.startsWith('/manage/')) return target;
  return null;
}

export function signInPath(accountId: AccountId, next: string | null): string {
  return manageNext(next) ?? homePath(accountId);
}
