import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { baseline, domainExamples } from '../data/accounts.ts';
import { reducer } from '../state/reducer.ts';
import { StoreProvider, writeSession } from '../state/store.tsx';
import type { AppState, DomainState } from '../state/types.ts';
import { Domain } from './Domain.tsx';
import styles from './Domain.module.css';
import {
  activateEnabled,
  activateReason,
  checkMessage,
  confirmation,
  currentStep,
  domainCopy,
  domainNameError,
  domainPhase,
  dnsExamplesFor,
  httpsCopy,
  showActivate,
  showNameForm,
  showVerify,
  verifyEnabled,
  verifyReason,
} from './DomainFlow.ts';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
}

function nanDomain(state: AppState): DomainState {
  const site = state.sites.nan;
  if (!site) throw new Error('missing nan');
  return site.domain;
}

function withDomain(
  domain: DomainState,
  state: AppState = baseline,
  slug = 'nan',
): AppState {
  const site = state.sites[slug];
  if (!site) throw new Error(`missing ${slug}`);
  return {
    ...state,
    sites: { ...state.sites, [slug]: { ...site, domain } },
  };
}

function renderDomain(path: string, state: AppState = baseline): string {
  const storage = memoryStorage();
  writeSession(storage, state);
  vi.stubGlobal('sessionStorage', storage);
  return renderToStaticMarkup(
    createElement(
      StoreProvider,
      null,
      createElement(
        MemoryRouter,
        { initialEntries: [path] },
        createElement(
          Routes,
          null,
          createElement(Route, {
            path: '/manage/:slug/domain',
            element: createElement(Domain),
          }),
        ),
      ),
    ),
  );
}

function buttonTag(html: string, label: string): string | undefined {
  return html
    .match(/<button\b[^>]*>[\s\S]*?<\/button>/g)
    ?.find((tag) => tag.includes(`>${label}</button>`));
}

function expectMarked(html: string, value: string) {
  const at = html.indexOf(`>${value}</code>`);
  expect(at, value).toBeGreaterThan(-1);
  expect(html.slice(Math.max(0, at - 40), at)).toContain(styles.value);
  expect(html.slice(at, at + value.length + 80)).toContain(
    `>${domainCopy.example}<`,
  );
}

const pending = reducer(baseline, {
  type: 'setDomain',
  slug: 'nan',
  name: 'nan.example',
});

const verified = reducer(pending, { type: 'verifyDomain', slug: 'nan' });

const active = reducer(verified, { type: 'activateDomain', slug: 'nan' });

const failed = reducer(
  {
    ...pending,
    simulate: { ...pending.simulate, domainCheck: 'fail' },
  },
  { type: 'verifyDomain', slug: 'nan' },
);

const deferred = withDomain({
  name: null,
  status: 'deferred',
  controlVerified: false,
});

describe('domain name', () => {
  it('asks for a name and ignores a blank one', () => {
    expect(domainNameError('')).toBe(domainCopy.nameRequired);
    expect(domainNameError('   ')).toBe(domainCopy.nameRequired);
    expect(domainNameError(' nan.example ')).toBeUndefined();
  });
});

describe('B5-AC1 domain control comes before activation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('follows setDomain, verifyDomain, then activateDomain', () => {
    expect(domainPhase(nanDomain(baseline))).toBe('name');
    expect(showNameForm(nanDomain(baseline))).toBe(true);
    expect(verifyEnabled(nanDomain(baseline))).toBe(false);
    expect(activateEnabled(nanDomain(baseline))).toBe(false);
    expect(verifyReason(nanDomain(baseline))).toBe(domainCopy.verifyBlocked);
    expect(activateReason(nanDomain(baseline))).toBe(
      domainCopy.activateBlocked,
    );
    expect(confirmation(nanDomain(baseline))).toBeNull();
    expect(currentStep(nanDomain(baseline))).toBe(0);

    expect(domainPhase(nanDomain(pending))).toBe('check');
    expect(showNameForm(nanDomain(pending))).toBe(false);
    expect(verifyEnabled(nanDomain(pending))).toBe(true);
    expect(showVerify(nanDomain(pending))).toBe(true);
    expect(activateEnabled(nanDomain(pending))).toBe(false);
    expect(confirmation(nanDomain(pending))).toBeNull();
    expect(currentStep(nanDomain(pending))).toBe(2);

    expect(domainPhase(nanDomain(verified))).toBe('activate');
    expect(showVerify(nanDomain(verified))).toBe(false);
    expect(activateEnabled(nanDomain(verified))).toBe(true);
    expect(showActivate(nanDomain(verified))).toBe(true);
    expect(confirmation(nanDomain(verified))).toBe(domainCopy.confirmedPending);
    expect(currentStep(nanDomain(verified))).toBe(4);

    expect(nanDomain(active)).toEqual({
      name: 'nan.example',
      status: 'active',
      controlVerified: true,
    });
    expect(showActivate(nanDomain(active))).toBe(false);
    expect(showVerify(nanDomain(active))).toBe(false);
    expect(activateEnabled(nanDomain(active))).toBe(false);
    expect(confirmation(nanDomain(active))).toBe(domainCopy.confirmed);
    expect(currentStep(nanDomain(active))).toBeNull();
  });

  it('refuses activation when control is missing, failed, or already active', () => {
    expect(
      activateEnabled({
        name: 'nan.example',
        status: 'pending',
        controlVerified: false,
      }),
    ).toBe(false);
    expect(
      activateEnabled({
        name: 'nan.example',
        status: 'failed',
        controlVerified: true,
      }),
    ).toBe(false);
    expect(
      activateEnabled({
        name: 'nan.example',
        status: 'active',
        controlVerified: true,
      }),
    ).toBe(false);
    expect(verifyEnabled(nanDomain(failed))).toBe(true);
    expect(activateEnabled(nanDomain(failed))).toBe(false);
  });

  it('puts the name, TXT, check and activation in that order', () => {
    const html = renderDomain('/manage/nan/domain');
    const nameAt = html.indexOf(domainCopy.nameLabel);
    const txtAt = html.indexOf(domainCopy.txtTitle);
    const checkAt = html.indexOf(`>${domainCopy.check}</button>`);
    const activateAt = html.indexOf(`>${domainCopy.activate}</button>`);

    expect(nameAt).toBeGreaterThan(-1);
    expect(nameAt).toBeLessThan(txtAt);
    expect(txtAt).toBeLessThan(checkAt);
    expect(checkAt).toBeLessThan(activateAt);
    expect(buttonTag(html, domainCopy.check)).toContain('disabled');
    expect(buttonTag(html, domainCopy.activate)).toContain('disabled');
    expect(html).toContain(domainCopy.verifyBlocked);
    expect(html).toContain(domainCopy.activateBlocked);
    expect(html).not.toContain(domainCopy.confirmed);
    expect(html).toContain('<h1>Домен</h1>');
    expect(html).toContain('aria-current="step"');
  });

  it('shows the confirmation and only then enables activation', () => {
    const waiting = renderDomain('/manage/nan/domain', pending);
    expect(waiting).toContain(domainCopy.pending);
    expect(waiting).not.toContain(domainCopy.confirmed);
    expect(buttonTag(waiting, domainCopy.check)).not.toContain('disabled');
    expect(buttonTag(waiting, domainCopy.activate)).toContain('disabled');

    const ready = renderDomain('/manage/nan/domain', verified);
    const confirmedAt = ready.indexOf(domainCopy.confirmed);
    const activateAt = ready.indexOf(`>${domainCopy.activate}</button>`);
    expect(confirmedAt).toBeGreaterThan(-1);
    expect(confirmedAt).toBeLessThan(activateAt);
    expect(buttonTag(ready, domainCopy.activate)).not.toContain('disabled');
    expect(buttonTag(ready, domainCopy.check)).toBeUndefined();
    expect(ready).toContain('Ожидание');
    expect(ready).not.toContain(domainCopy.pending);

    const done = renderDomain('/manage/nan/domain', active);
    expect(done).toContain(domainCopy.confirmed);
    expect(done).toContain('Активен');
    expect(buttonTag(done, domainCopy.activate)).toBeUndefined();
    expect(buttonTag(done, domainCopy.check)).toBeUndefined();
    expect(buttonTag(done, domainCopy.nameSubmit)).toBeUndefined();
  });
});

describe('B5-AC2 pending and failed explanations differ', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses a different text and alert role for each outcome', () => {
    expect(checkMessage(nanDomain(pending))).toEqual({
      tone: 'warn',
      text: domainCopy.pending,
    });
    expect(checkMessage(nanDomain(failed))).toEqual({
      tone: 'error',
      text: domainCopy.failed,
    });
    expect(domainCopy.pending).not.toBe(domainCopy.failed);
    expect(httpsCopy(nanDomain(pending))).toBe(domainCopy.httpsPending);
    expect(httpsCopy(nanDomain(failed))).toBe(domainCopy.httpsFailed);
    expect(httpsCopy(nanDomain(pending))).not.toBe(
      httpsCopy(nanDomain(failed)),
    );

    const waiting = renderDomain('/manage/nan/domain', pending);
    const broken = renderDomain('/manage/nan/domain', failed);

    expect(waiting).toContain(domainCopy.pending);
    expect(waiting).toContain('role="status"');
    expect(waiting).not.toContain(domainCopy.failed);
    expect(waiting).toContain('Ожидание');
    expect(waiting).not.toContain('>Ошибка<');

    expect(broken).toContain(domainCopy.failed);
    expect(broken).toContain('role="alert"');
    expect(broken).not.toContain(domainCopy.pending);
    expect(broken).toContain('>Ошибка<');
    expect(broken).not.toContain('Ожидание');
    expect(buttonTag(broken, domainCopy.check)).not.toContain('disabled');
    expect(buttonTag(broken, domainCopy.activate)).toContain('disabled');
  });
});

describe('B5-AC3 example domain values', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('marks the nan records as examples in mono', () => {
    const dns = dnsExamplesFor('nan.example');
    expect(dns).toEqual({
      domainName: 'nan.example',
      txtName: domainExamples.txtName,
      txtValue: domainExamples.txtValue,
      cname: `${domainExamples.cnameName} → ${domainExamples.cnameTarget}`,
      certificate: domainExamples.certificate,
    });
    for (const value of [dns.domainName, dns.txtName, dns.cname]) {
      expect(value).toContain('.example');
    }

    for (const state of [
      baseline,
      pending,
      verified,
      active,
      failed,
      deferred,
    ]) {
      const html = renderDomain('/manage/nan/domain', state);
      const shown = dnsExamplesFor(nanDomain(state).name ?? 'nan.example');
      expectMarked(html, shown.domainName);
      expectMarked(html, shown.txtName);
      expectMarked(html, shown.txtValue);
      expectMarked(html, shown.cname);
      expectMarked(html, shown.certificate);
      expect(html.match(/пример/g)?.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('uses temir.example on the other account', () => {
    const dns = dnsExamplesFor('temir.example');
    expect(dns.txtName).toBe('_alertion-verify.temir.example');
    expect(dns.cname).toBe('temir.example → sites.alertion.example');
    expect(dns.txtValue).toBe(domainExamples.txtValue);
    expect(dns.certificate).toBe(domainExamples.certificate);

    const html = renderDomain('/manage/temir/domain');
    expect(html).toContain('Мастерская Темир');
    expect(html).not.toContain('nan.example');
    expect(html).not.toContain('Пекарня Нан');
    expectMarked(html, 'temir.example');
    expectMarked(html, dns.txtName);
    expectMarked(html, dns.cname);
    expectMarked(html, dns.certificate);
  });
});

describe('B5 task ownership and DNS instructions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('tells the owner which account the records belong to', () => {
    const html = renderDomain('/manage/nan/domain', pending);
    expect(html).toContain(
      'Домен принадлежит аккаунту сайта «Пекарня Нан». Чужой аккаунт не меняет эти записи.',
    );
    expect(html).toContain(domainCopy.simulation);
    expect(html).toContain(domainCopy.txtHelp);
    expect(html).toContain(domainCopy.cnameLater);
    expect(html).toContain(domainCopy.steps[0]);
    expect(html).toContain(domainCopy.steps[1]);
    expect(domainCopy.steps.join(' ')).not.toContain(domainCopy.confirmed);
  });
});

describe('G4 pending, active and failed domain and HTTPS', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('distinguishes the three states and keeps deferred unavailable', () => {
    const waiting = renderDomain('/manage/nan/domain', pending);
    const done = renderDomain('/manage/nan/domain', active);
    const broken = renderDomain('/manage/nan/domain', failed);
    const held = renderDomain('/manage/nan/domain', deferred);

    expect(waiting).toContain(domainCopy.httpsPending);
    expect(done).toContain(domainCopy.httpsActive);
    expect(broken).toContain(domainCopy.httpsFailed);
    expect(
      new Set([
        domainCopy.httpsPending,
        domainCopy.httpsActive,
        domainCopy.httpsFailed,
      ]).size,
    ).toBe(3);

    expect(done).toContain('>Активен<');
    expect(done).not.toContain('Ожидание');
    expect(done).not.toContain('>Ошибка<');
    expect(httpsCopy(nanDomain(verified))).toBe(domainCopy.httpsAfterActivate);

    expect(held).toContain(domainCopy.deferred);
    expect(buttonTag(held, domainCopy.check)).toContain('disabled');
    expect(buttonTag(held, domainCopy.activate)).toContain('disabled');
    expect(buttonTag(held, domainCopy.nameSubmit)).toBeUndefined();
    expect(held).not.toContain(domainCopy.confirmed);
    expect(held).not.toContain('Ожидание');
    expect(domainPhase(nanDomain(deferred))).toBe('deferred');
    expect(showNameForm(nanDomain(deferred))).toBe(false);
  });

  it('does not give an unknown address a domain screen', () => {
    const html = renderDomain('/manage/missing/domain');
    expect(html).toContain('<h1>Страница не найдена</h1>');
    expect(html).not.toContain(domainCopy.nameSubmit);
    expect(html).not.toContain(domainCopy.check);
  });
});
