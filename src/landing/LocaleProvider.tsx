import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { copy, type Locale } from './content.ts';
import { LocaleContext } from './locale.ts';

const KEY = 'alertion.lang';

function isLocale(value: unknown): value is Locale {
  return value === 'ru' || value === 'en';
}

/** `?lang=en` wins, then the saved choice; the project's own language is the default. */
function initialLocale(): Locale {
  try {
    const asked = new URLSearchParams(window.location.search).get('lang');
    if (isLocale(asked)) return asked;
    const saved = window.localStorage.getItem(KEY);
    if (isLocale(saved)) return saved;
  } catch {
    // Storage can be blocked; the default still works.
  }
  return 'ru';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setState] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = copy[locale].title;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    const apply = () => setState(next);
    const start = (
      document as Document & {
        startViewTransition?: (update: () => void) => unknown;
      }
    ).startViewTransition;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (start && !still) start.call(document, () => flushSync(apply));
    else apply();
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      // The choice still applies until the page is closed.
    }
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale, t: copy[locale] }),
    [locale, setLocale],
  );
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}
