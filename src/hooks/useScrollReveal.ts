import { useEffect, useRef } from 'react';

/**
 * Custom hook that applies scroll-reveal animation to elements.
 * Uses IntersectionObserver to add .revealed class when elements enter viewport.
 */
export function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    // Observe the container itself
    if (el.classList.contains('reveal-on-scroll')) {
      observer.observe(el);
    }

    // Observe all children marked for reveal
    const children = el.querySelectorAll('.reveal-on-scroll');
    children.forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
