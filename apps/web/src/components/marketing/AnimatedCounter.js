'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Tickers a number from 0 → target when it enters the viewport.
 *
 * Supports formats like "10,000+", "2.4M", "99.99%", "< 100ms" — the prefix /
 * suffix is preserved; only the leading numeric portion is animated.
 */
export default function AnimatedCounter({ value, duration = 1400 }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!ref.current) return;
    const match = /([^\d.]*)([\d.,]+)(.*)$/.exec(value);
    if (!match) { setDisplay(value); return; }
    const prefix = match[1];
    const rawNum = parseFloat(match[2].replace(/,/g, ''));
    const suffix = match[3];
    const hasComma = match[2].includes(',');
    const decimals = (match[2].split('.')[1] || '').length;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();

        const start = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration);
          // ease-out cubic
          const eased = 1 - Math.pow(1 - t, 3);
          const cur = rawNum * eased;
          let str = decimals ? cur.toFixed(decimals) : Math.round(cur).toString();
          if (hasComma && !decimals) str = Math.round(cur).toLocaleString();
          setDisplay(`${prefix}${str}${suffix}`);
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{display}</span>;
}
