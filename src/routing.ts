import { accounts } from './data/accounts.ts';
import type { AccountId } from './state/types.ts';

export function accountSlug(accountId: AccountId | null): string | null {
  if (accountId === null) return null;
  const account = accounts.find((item) => item.id === accountId);
  return account ? account.slug : null;
}

export function homePath(accountId: AccountId | null): string {
  const slug = accountSlug(accountId);
  return slug ? `/manage/${slug}` : '/login';
}
