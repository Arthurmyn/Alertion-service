import { Link } from 'react-router-dom';
import { accounts } from '../data/accounts.ts';
import { accountSlug } from '../routing.ts';
import { useStore } from '../state/store.tsx';

export function AccessDenied() {
  const { state } = useStore();
  const slug = accountSlug(state.sessionAccountId);
  const account = accounts.find((item) => item.id === state.sessionAccountId);

  return (
    <>
      <h1>Нет доступа</h1>
      <p>Этот сайт принадлежит другому аккаунту.</p>
      <p>Симуляция: данные управления здесь не показываются.</p>
      {slug !== null && account ? (
        <p>
          <Link to={`/manage/${slug}`}>
            К своему сайту «{account.businessName}»
          </Link>
        </p>
      ) : (
        <p>
          <Link to="/login">Вход</Link>
        </p>
      )}
    </>
  );
}
