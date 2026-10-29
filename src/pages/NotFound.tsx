import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <>
      <h1>Страница не найдена</h1>
      <p>
        <Link to="/">На главную</Link>
      </p>
    </>
  );
}
