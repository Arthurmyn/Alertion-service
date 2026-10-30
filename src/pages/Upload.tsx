import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { archives, type ArchiveFixture } from '../data/archives.ts';
import { Alert } from '../components/ui/Alert.tsx';
import { Button } from '../components/ui/Button.tsx';
import { exampleUrl } from '../state/selectors.ts';
import { useStore } from '../state/store.tsx';
import type { Site, UploadResult } from '../state/types.ts';
import { NotFound } from './NotFound.tsx';
import {
  activeLine,
  archiveLegend,
  archiveSizeNote,
  blockReason,
  checkDelay,
  checkingText,
  choiceHeading,
  emptyText,
  limitsSummary,
  openPlanText,
  openSiteLead,
  planGateText,
  simulationText,
  successMessage,
  uploadChoices,
  visibleUploadResult,
} from './UploadModel.ts';
import styles from './Upload.module.css';

export function UploadView({
  site,
  choices,
  selected,
  checking,
  result,
  planReady,
  onSelect,
  onCheck,
}: {
  site: Site;
  choices: readonly ArchiveFixture[];
  selected: string | null;
  checking: boolean;
  result: UploadResult | null;
  planReady: boolean;
  onSelect: (name: string) => void;
  onCheck: () => void;
}) {
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!checking) return;
    statusRef.current?.focus();
  }, [checking]);

  if (!planReady) {
    return (
      <>
        <h1>Загрузка</h1>
        <p>{planGateText}.</p>
        <p>
          <Link to={`/manage/${site.slug}/plan`}>{openPlanText}</Link>
        </p>
      </>
    );
  }

  const reason = checking ? null : blockReason(choices.length, selected);
  const href = exampleUrl(site);

  return (
    <>
      <h1>Загрузка</h1>
      <p>{activeLine(site)}</p>
      <p>{limitsSummary()}</p>
      {choices.length > 0 ? <p>{simulationText}</p> : null}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onCheck();
        }}
      >
        {choices.length > 0 ? (
          <fieldset className={styles.choices} disabled={checking}>
            <legend className={styles.legend}>
              {archiveLegend}
              <span className={styles.req} title="обязательно">
                {' *'}
              </span>
            </legend>
            {choices.map((archive) => {
              const note = archive.label ? archiveSizeNote(archive) : null;
              return (
                <label className={styles.choice} key={archive.name}>
                  <input
                    className={styles.radio}
                    type="radio"
                    name="archive"
                    value={archive.name}
                    checked={selected === archive.name}
                    required
                    onChange={() => onSelect(archive.name)}
                  />
                  <span className={styles.choiceBody}>
                    <span className={styles.name}>
                      {choiceHeading(archive)}
                    </span>
                    <span className={styles.file}>{archive.name}</span>
                    {note ? <span className={styles.meta}>{note}</span> : null}
                  </span>
                </label>
              );
            })}
          </fieldset>
        ) : null}
        <div className={styles.actions}>
          <Button type="submit" disabled={checking || reason !== null}>
            Проверить архив
          </Button>
          {reason ? <p className={styles.reason}>{reason}</p> : null}
        </div>
      </form>
      <div
        ref={statusRef}
        className={styles.status}
        tabIndex={-1}
        aria-live="polite"
        aria-atomic="true"
        aria-busy={checking ? true : undefined}
      >
        {checking ? <p className={styles.checking}>{checkingText}</p> : null}
        {!checking && result === null && choices.length > 0 ? (
          <p>{emptyText}</p>
        ) : null}
        {!checking && result?.ok ? (
          <>
            <p>{successMessage(site) ?? 'Проверка прошла.'}</p>
            <p>
              {openSiteLead}{' '}
              <Link className={styles.url} to={href}>
                {href}
              </Link>
            </p>
          </>
        ) : null}
        {!checking && result && !result.ok ? (
          <Alert>{result.nextStep}</Alert>
        ) : null}
      </div>
    </>
  );
}

function reducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function UploadForm({ site }: { site: Site }) {
  const { state, dispatch } = useStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const timer = useRef<number | null>(null);
  const pending = useRef(false);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const planReady = state.planSelected[site.ownerId];
  const choices = uploadChoices(site);
  const result = checking ? null : visibleUploadResult(site, state.lastResult);

  function onCheck() {
    if (!planReady || pending.current || checking || selected === null) return;
    const archive = archives[selected];
    if (!archive) return;

    pending.current = true;
    const run = () => {
      pending.current = false;
      timer.current = null;
      setChecking(false);
      dispatch({
        type: 'upload',
        slug: site.slug,
        archive,
        uploadedAt: new Date().toISOString(),
      });
    };

    const delay = checkDelay(reducedMotion());
    if (delay === 0) {
      run();
      return;
    }

    setChecking(true);
    timer.current = window.setTimeout(run, delay);
  }

  return (
    <UploadView
      site={site}
      choices={choices}
      selected={selected}
      checking={checking}
      result={result}
      planReady={planReady}
      onSelect={setSelected}
      onCheck={onCheck}
    />
  );
}

export function Upload() {
  const { slug = '' } = useParams();
  const { state } = useStore();
  const site = state.sites[slug];
  if (!site) return <NotFound />;
  return <UploadForm key={site.slug} site={site} />;
}
