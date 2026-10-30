import { accounts } from '../data/accounts.ts';
import type { AccountId } from '../state/types.ts';

export function accountSlug(accountId: AccountId | null): string | null {
  if (accountId === null) return null;
  const account = accounts.find((item) => item.id === accountId);
  return account ? account.slug : null;
}

/** Signed-in users land on the workspace overview; everyone else signs in. */
export function homePath(accountId: AccountId | null): string {
  return accountSlug(accountId) ? '/manage' : '/login';
}

export function projectPath(slug: string, suffix = ''): string {
  return `/manage/${slug}${suffix}`;
}
