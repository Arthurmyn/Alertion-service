import { BrowserRouter } from 'react-router-dom';
import '../styles/global.css';
import { App } from './App.tsx';

/** The service. Every address inside it is relative to `/app`. */
export default function AppRoot() {
  return (
    <BrowserRouter basename="/app">
      <App />
    </BrowserRouter>
  );
}
