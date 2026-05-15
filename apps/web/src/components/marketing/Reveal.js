'use client';
import { useEffect, useRef } from 'react';

/**
 * Adds .is-visible to children when they enter the viewport. Pure CSS handles
 * the actual animation — see .reveal in globals.css.
 *
 * Usage: <Reveal><h2 className="reveal">…</h2></Reveal>
 *
 * Or use the all-in-one <RevealOnScroll> wrapper.
 */
export default function RevealOnScroll({ as: Tag = 'div', className = '', delay = 0, children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Stagger via inline transition-delay
          if (delay) el.style.transitionDelay = `${delay}ms`;
          el.classList.add('is-visible');
          obs.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return (
    <Tag ref={ref} className={`reveal ${className}`}>
      {children}
    </Tag>
  );
}
