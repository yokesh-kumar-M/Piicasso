import React, { useEffect, useRef, useState } from 'react';

/**
 * Parallax — translate Y on scroll based on element position relative to viewport center.
 * `speed` (default 0.15) controls how fast it moves; higher = stronger parallax.
 */
export default function Parallax({ children, speed = 0.15, style, ...rest }) {
  const ref = useRef(null);
  const [y, setY] = useState(0);

  useEffect(() => {
    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const center = r.top + r.height / 2 - window.innerHeight / 2;
        setY(-center * speed);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [speed]);

  return (
    <div
      ref={ref}
      style={{
        ...style,
        transform: `translate3d(0, ${y.toFixed(1)}px, 0)`,
        willChange: 'transform',
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
