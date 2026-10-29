import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { accounts } from '../data/accounts.ts';
import { Alert } from '../components/Alert.tsx';
import { Button } from '../components/Button.tsx';
import { Field } from '../components/Field.tsx';
import { StatusLabel } from '../components/StatusLabel.tsx';
import { useStore } from '../state/store.tsx';
import type { DomainState } from '../state/types.ts';
import styles from './Domain.module.css';
import {
  activateEnabled,
  activateReason,
  checkMessage,
  cnameCopy,
  confirmation,
  currentStep,
  domainCopy,
  domainNameError,
  domainPhase,
  dnsExamplesFor,
  httpsCopy,
  nameCaption,
  ownershipCopy,
  showActivate,
  showNameForm,
  showVerify,
  shownDomainName,
  verifyEnabled,
  verifyReason,
  type DnsExamples,
} from './DomainFlow.ts';
import { NotFound } from './NotFound.tsx';

function Marked({ value }: { value: string }) {
  return (
    <>
      <code className={styles.value}>{value}</code>{' '}
      <span className={styles.example}>{domainCopy.example}</span>
    </>
  );
}

function NameForm({ onSave }: { onSave: (name: string) => void }) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | undefined>();

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const next = domainNameError(name);
        setError(next);
        if (next) return;
        onSave(name);
      }}
    >
      <Field
        label={domainCopy.nameLabel}
        name="domain"
        value={name}
        required
        error={error}
        onChange={(value) => {
          setName(value);
          if (error) setError(domainNameError(value));
        }}
      />
      <Button type="submit">{domainCopy.nameSubmit}</Button>
    </form>
  );
}

function DomainStatusBlock({ domain }: { domain: DomainState }) {
  if (domain.status === 'notStarted') {
    return <p>{domainCopy.notConnected}</p>;
  }
  if (domain.status === 'deferred') {
    return (
      <p>
        <StatusLabel status="deferred" />
      </p>
    );
  }
  return (
    <dl className={styles.states}>
      <div>
        <dt>{domainCopy.domainLabel}</dt>
        <dd>
          <StatusLabel status={domain.status} />
        </dd>
      </div>
      <div>
        <dt>{domainCopy.httpsLabel}</dt>
        <dd>
          <StatusLabel status={domain.status} />
        </dd>
      </div>
    </dl>
  );
}

function TxtRecords({ dns }: { dns: DnsExamples }) {
  return (
    <dl className={styles.records}>
      <div>
        <dt>{domainCopy.txtName}</dt>
        <dd>
          <Marked value={dns.txtName} />
        </dd>
      </div>
      <div>
        <dt>{domainCopy.txtValue}</dt>
        <dd>
          <Marked value={dns.txtValue} />
        </dd>
      </div>
    </dl>
  );
}

export function Domain() {
  const { slug = '' } = useParams();
  const { state, dispatch } = useStore();
  const site = state.sites[slug];
  const account = accounts.find((item) => item.id === site?.ownerId);
  const phase = domainPhase(
    site?.domain ?? {
      name: null,
      status: 'notStarted',
      controlVerified: false,
    },
  );
  const phaseRef = useRef(phase);
  const txtRef = useRef<HTMLHeadingElement>(null);
  const confirmedRef = useRef<HTMLParagraphElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phaseRef.current === phase) return;
    const previous = phaseRef.current;
    phaseRef.current = phase;
    if (phase === 'check' && previous === 'name') {
      txtRef.current?.focus({ focusVisible: true });
    } else if (phase === 'activate') {
      confirmedRef.current?.focus({ focusVisible: true });
    } else if (phase === 'active') {
      statusRef.current?.focus({ focusVisible: true });
    }
  }, [phase]);

  if (!site || !account) return <NotFound />;

  const domain = site.domain;
  const dns = dnsExamplesFor(shownDomainName(domain, account.domainName));
  const step = currentStep(domain);
  const message = checkMessage(domain);
  const verified = confirmation(domain);
  const https = httpsCopy(domain);
  const cname = cnameCopy(domain);
  const verifyWhy = verifyReason(domain);
  const activateWhy = activateReason(domain);

  return (
    <article>
      <h1>Домен</h1>
      <p>{ownershipCopy(site.businessName)}</p>
      <p>{domainCopy.simulation}</p>
      <div ref={statusRef} tabIndex={phase === 'active' ? -1 : undefined}>
        <DomainStatusBlock domain={domain} />
      </div>
      {step !== null ? (
        <>
          <h2>{domainCopy.stepsTitle}</h2>
          <ol className={styles.steps}>
            {domainCopy.steps.map((text, index) => (
              <li
                key={text}
                className={index === step ? styles.current : undefined}
                aria-current={index === step ? 'step' : undefined}
              >
                {text}
              </li>
            ))}
          </ol>
        </>
      ) : null}
      <p>
        {nameCaption(domain)} <Marked value={dns.domainName} />
      </p>
      {showNameForm(domain) ? (
        <NameForm
          key={slug}
          onSave={(name) =>
            dispatch({ type: 'setDomain', slug: site.slug, name })
          }
        />
      ) : null}
      <h2 ref={txtRef} tabIndex={-1}>
        {domainCopy.txtTitle}
      </h2>
      <p>{domainCopy.txtHelp}</p>
      <TxtRecords dns={dns} />
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
      {showVerify(domain) ? (
        <div className={styles.action}>
          <Button
            disabled={!verifyEnabled(domain)}
            onClick={() => dispatch({ type: 'verifyDomain', slug: site.slug })}
          >
            {domainCopy.check}
          </Button>
        </div>
      ) : null}
      {verifyWhy ? <p className={styles.reason}>{verifyWhy}</p> : null}
      {verified ? (
        <p
          ref={confirmedRef}
          className={styles.confirmed}
          tabIndex={-1}
          role="status"
        >
          {verified}
        </p>
      ) : null}
      {showActivate(domain) ? (
        <div className={styles.action}>
          <Button
            disabled={!activateEnabled(domain)}
            onClick={() =>
              dispatch({ type: 'activateDomain', slug: site.slug })
            }
          >
            {domainCopy.activate}
          </Button>
        </div>
      ) : null}
      {activateWhy && activateWhy !== verifyWhy ? (
        <p className={styles.reason}>{activateWhy}</p>
      ) : null}
      <h2>{domainCopy.cnameTitle}</h2>
      {cname ? <p>{cname}</p> : null}
      <p>
        <Marked value={dns.cname} />
      </p>
      <h2>{domainCopy.certTitle}</h2>
      {https ? <p>{https}</p> : null}
      <p>
        <Marked value={dns.certificate} />
      </p>
    </article>
  );
}
