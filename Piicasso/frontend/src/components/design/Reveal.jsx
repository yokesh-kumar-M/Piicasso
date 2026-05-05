import React, { useEffect, useRef, useState } from 'react';

/**
 * Reveal — fade/slide content in when scrolled into view (uses IntersectionObserver).
 * Variants: 'up' (default), 'left', 'right', 'scale'. Set `stagger` to animate children sequentially.
 */
export default function Reveal({
  children,
  variant = 'up',
  stagger = false,
  delay = 0,
  as: Tag = 'div',
  style,
  className = '',
  ...rest
}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const t = setTimeout(() => setShown(true), delay);
            io.unobserve(el);
            return () => clearTimeout(t);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  const variantClass =
    variant === 'left' ? 'reveal-left'
    : variant === 'right' ? 'reveal-right'
    : variant === 'scale' ? 'reveal-scale'
    : '';

  return (
    <Tag
      ref={ref}
      className={`reveal ${variantClass} ${stagger ? 'stagger' : ''} ${shown ? 'in' : ''} ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
