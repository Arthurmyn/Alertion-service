import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button.tsx';
import { accounts } from '../data/accounts.ts';
import { useStore } from '../state/store.tsx';
import type { AccountId } from '../state/types.ts';
import { manageNext, signInPath } from './LoginPath.ts';
import styles from './Login.module.css';

export function Login() {
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next');
  const target = manageNext(next);

  function enter(accountId: AccountId) {
    dispatch({ type: 'signIn', accountId });
    navigate(signInPath(accountId, next), { replace: true });
  }

  return (
    <>
      <h1
        aria-describedby={
          target !== null ? 'login-return login-accounts' : 'login-accounts'
        }
      >
        Вход
      </h1>
      {target !== null ? (
        <p id="login-return">
          Войдите, чтобы управлять сайтом. После входа откроется{' '}
          <code className={styles.path}>{target}</code>.
        </p>
      ) : null}
      <p id="login-accounts">
        2 вымышленных аккаунта. Пароля нет, это симуляция.
      </p>
      <ul className={styles.actions} aria-labelledby="login-accounts">
        {accounts.map((account) => (
          <li key={account.id}>
            <Button onClick={() => enter(account.id)}>
              Войти как {account.ownerName}, {account.businessName}
            </Button>
          </li>
        ))}
      </ul>
    </>
  );
}
