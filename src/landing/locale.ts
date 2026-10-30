import { createContext, useContext } from 'react';
import { copy, type Copy, type Locale } from './content.ts';

export interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Copy;
}

export const LocaleContext = createContext<LocaleState>({
  locale: 'ru',
  setLocale: () => undefined,
  t: copy.ru,
});

export function useLocale(): LocaleState {
  return useContext(LocaleContext);
}
