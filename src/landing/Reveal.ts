import { useEffect } from 'react';

/**
 * Fade sections in once as they scroll into view. Content stays visible when
 * scripts or motion are unavailable: only elements below the fold are hidden
 * first, and reduced motion skips the effect entirely.
 */
export function useReveal(): void {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const nodes = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.state = 'shown';
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    for (const node of nodes) {
      if (node.getBoundingClientRect().top < window.innerHeight) continue;
      node.dataset.state = 'hidden';
      observer.observe(node);
    }
    return () => observer.disconnect();
  }, []);
}
