import type { Site, Version } from '../state/types.ts';

/**
 * Verification state of one deployment. Only a real attestation record can
 * produce `verified`; the other states exist so the interface can show them
 * the day a source is connected.
 */
export type VerificationStatus =
  'verified' | 'failed' | 'pending' | 'unavailable';

/** Verification results by `slug/versionId`. Empty: nothing produces them yet. */
const verificationRecords: Readonly<Record<string, VerificationStatus>> = {};

export function verificationFor(
  site: Site,
  version: Version,
): VerificationStatus {
  return verificationRecords[`${site.slug}/${version.id}`] ?? 'unavailable';
}

export const verificationLabel: Record<VerificationStatus, string> = {
  verified: 'Проверено',
  failed: 'Не пройдено',
  pending: 'Ожидает проверки',
  unavailable: 'Проверка недоступна',
};

export const verificationHint: Record<VerificationStatus, string> = {
  verified: 'Развёртывание совпадает с проверенным исходным кодом и сборкой.',
  failed: 'Развёртывание не совпало с ожидаемым исходным кодом или сборкой.',
  pending: 'Аттестация получена, сравнение с исходным кодом ещё идёт.',
  unavailable:
    'В прототипе нет источника аттестации, поэтому результат проверки неизвестен.',
};
