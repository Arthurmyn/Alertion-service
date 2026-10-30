import './landing.css';
import { Landing } from './Landing.tsx';
import { LocaleProvider } from './LocaleProvider.tsx';

export default function LandingRoot() {
  return (
    <LocaleProvider>
      <Landing />
    </LocaleProvider>
  );
}
