import { useEffect } from 'react';
import './landing.css';
import { Landing } from './Landing.tsx';

export default function LandingRoot() {
  useEffect(() => {
    document.title = 'Alertion: хостинг сайтов, который можно проверить';
  }, []);
  return <Landing />;
}
