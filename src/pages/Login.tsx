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

  function enter(accountId: AccountId) {
    dispatch({ type: 'signIn', accountId });
    navigate(signInPath(accountId, next), { replace: true });
  }

  return (
    <>
      <h1>Вход</h1>
      {manageNext(next) !== null ? (
        <p>Войдите, чтобы управлять сайтом.</p>
      ) : null}
      <p>2 аккаунта. Вход без пароля, симуляция.</p>
      <div className={styles.actions}>
        {accounts.map((account) => (
          <Button key={account.id} onClick={() => enter(account.id)}>
            {account.ownerName}, {account.businessName}
          </Button>
        ))}
      </div>
    </>
  );
}
