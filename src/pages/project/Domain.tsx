import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { accounts } from '../../data/accounts.ts';
import { Alert } from '../../components/ui/Alert.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Field } from '../../components/ui/Field.tsx';
import { StatusLabel } from '../../components/ui/StatusLabel.tsx';
import { useStore } from '../../state/store.tsx';
import type { DomainState } from '../../state/types.ts';
import styles from './Domain.module.css';
import {
  activateEnabled,
  activateReason,
  checkMessage,
  cnameCopy,
  confirmation,
  currentStep,
  domainCopy,
  canonicalDomainName,
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
} from './DomainFlow.ts';
import { NotFound } from '../NotFound.tsx';

function Marked({ value }: { value: string }) {
  return (
    <span className={styles.marked}>
      <code className={styles.value}>{value}</code>
      <span className={styles.example}>{domainCopy.example}</span>
    </span>
  );
}

function Records({ rows }: { rows: readonly (readonly [string, string])[] }) {
  return (
    <dl className={styles.records}>
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>
            <Marked value={value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function NameForm({
  example,
  onSave,
}: {
  example: string;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [attempts, setAttempts] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (attempts === 0) return;
    const input = formRef.current?.querySelector('input');
    if (input instanceof HTMLInputElement) {
      input.focus({ focusVisible: true });
    }
  }, [attempts]);

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const next = domainNameError(name, example);
        setError(next);
        if (next) {
          setAttempts((count) => count + 1);
          return;
        }
        onSave(canonicalDomainName(name));
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
          if (error) setError(domainNameError(value, example));
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

function StepButton({
  label,
  enabled,
  reason,
  onClick,
}: {
  label: string;
  enabled: boolean;
  reason: string | null;
  onClick: () => void;
}) {
  return (
    <>
      <div className={styles.action}>
        <Button disabled={!enabled} onClick={onClick}>
          {label}
        </Button>
      </div>
      {reason ? <p className={styles.reason}>{reason}</p> : null}
    </>
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
          example={account.domainName}
          onSave={(name) =>
            dispatch({ type: 'setDomain', slug: site.slug, name })
          }
        />
      ) : null}
      <h2 ref={txtRef} tabIndex={-1}>
        {domainCopy.txtTitle}
      </h2>
      <p>{domainCopy.txtHelp}</p>
      <Records
        rows={[
          [domainCopy.txtName, dns.txtName],
          [domainCopy.txtValue, dns.txtValue],
        ]}
      />
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
      {showVerify(domain) ? (
        <StepButton
          label={domainCopy.check}
          enabled={verifyEnabled(domain)}
          reason={verifyWhy}
          onClick={() => dispatch({ type: 'verifyDomain', slug: site.slug })}
        />
      ) : null}
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
        <StepButton
          label={domainCopy.activate}
          enabled={activateEnabled(domain)}
          reason={activateWhy !== verifyWhy ? activateWhy : null}
          onClick={() => dispatch({ type: 'activateDomain', slug: site.slug })}
        />
      ) : null}
      <h2>{domainCopy.cnameTitle}</h2>
      {cname ? <p>{cname}</p> : null}
      <Records
        rows={[
          [domainCopy.cnameHost, dns.cnameName],
          [domainCopy.cnameAddress, dns.cnameTarget],
        ]}
      />
      <h2>{domainCopy.certTitle}</h2>
      {https ? <p>{https}</p> : null}
      <p>
        <Marked value={dns.certificate} />
      </p>
    </article>
  );
}
