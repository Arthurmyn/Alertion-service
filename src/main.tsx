import { StrictMode, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';

/**
 * One page, two products: the landing lives at `/`, the service under `/app`.
 * Each is its own chunk with its own stylesheet, so neither pays for the other.
 */
const { pathname, search, hash } = window.location;
const inApp = pathname === '/app' || pathname.startsWith('/app/');

/** Addresses from before the service moved under /app keep working. */
const legacy = /^\/(manage|login|defense|site)(\/|$)/;
if (legacy.test(pathname)) {
  window.location.replace(`/app${pathname}${search}${hash}`);
} else {
  void start();
}

/**
 * Load the interface face before the first paint, so text does not reflow when
 * Inter arrives after a fallback. A slow load never blocks for long.
 */
function loadFaces(): Promise<unknown> {
  const faces = ['400', '500', '600'].map((weight) => `${weight} 1em Inter`);
  return Promise.race([
    Promise.all(faces.map((face) => document.fonts.load(face, 'Aa Яя'))),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]).catch(() => undefined);
}

async function loadRoot(): Promise<ComponentType> {
  // Two separate imports, so each page fetches only its own chunk and styles.
  if (inApp) {
    const { default: Root } = await import('./app/AppRoot.tsx');
    return Root;
  }
  const { default: Root } = await import('./landing/LandingRoot.tsx');
  return Root;
}

async function start(): Promise<void> {
  const [Root] = await Promise.all([loadRoot(), loadFaces()]);
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Root />
    </StrictMode>,
  );
}
