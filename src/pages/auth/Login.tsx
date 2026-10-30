import { useEffect, useRef, type CSSProperties } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IconChevronRight } from '../../components/ui/icons.tsx';
import { accounts } from '../../data/accounts.ts';
import { initials } from '../../data/workspace.ts';
import { useStore } from '../../state/store.tsx';
import type { AccountId } from '../../state/types.ts';
import { manageNext, signInPath } from './LoginPath.ts';
import styles from './Login.module.css';

export function Login() {
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next');
  const target = manageNext(next);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  function enter(accountId: AccountId) {
    dispatch({ type: 'signIn', accountId });
    navigate(signInPath(accountId, next), { replace: true });
  }

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <h1
          ref={headingRef}
          className={styles.title}
          tabIndex={-1}
          aria-describedby={
            target !== null ? 'login-return login-accounts' : 'login-accounts'
          }
        >
          Вход
        </h1>
        {target !== null ? (
          <p id="login-return" className={styles.lead}>
            Войдите, чтобы управлять сайтом. После входа откроется{' '}
            <code className={styles.path}>{target}</code>.
          </p>
        ) : null}
        <p id="login-accounts" className={styles.note}>
          2 вымышленных аккаунта. Пароля нет, это симуляция.
        </p>
      </header>

      <ul className={styles.accounts} aria-labelledby="login-accounts">
        {accounts.map((account, index) => (
          <li key={account.id} style={{ '--i': index } as CSSProperties}>
            <button
              type="button"
              className={styles.account}
              aria-label={`Войти как ${account.ownerName}, ${account.businessName}`}
              onClick={() => enter(account.id)}
            >
              <span className={styles.avatar} aria-hidden="true">
                {initials(account.ownerName)}
              </span>
              <span className={styles.who} aria-hidden="true">
                <span className={styles.owner}>{account.ownerName}</span>
                <span className={styles.business}>{account.businessName}</span>
              </span>
              <span className={styles.foot} aria-hidden="true">
                <span className={styles.domain}>{account.domainName}</span>
                <span className={styles.go}>
                  Владелец сайта
                  <IconChevronRight />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <p className={styles.after}>
        После входа открывается управление сайтом: загрузка, предпросмотр,
        публикация и откат версий.
      </p>
    </div>
  );
}
