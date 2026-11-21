'use client';

import { useEffect, useRef } from 'react';

/** Local pointer light, kept separate from the refracted background and sharp content. */
export function LiquidGlassSurface() {
  const surface = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const layer = surface.current;
    const target = layer?.parentElement;
    if (!layer || !target) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const precise = matchMedia('(hover: hover) and (pointer: fine)');
    let frame = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      frame = 0;
      layer.style.setProperty('--glass-x', `${x}px`);
      layer.style.setProperty('--glass-y', `${y}px`);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || reduced.matches || !precise.matches)
        return;
      const bounds = target.getBoundingClientRect();
      x = event.clientX - bounds.left;
      y = event.clientY - bounds.top;
      layer.dataset.lit = 'true';
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const leave = () => {
      delete layer.dataset.lit;
    };
    target.addEventListener('pointerenter', move);
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerleave', leave);
    reduced.addEventListener('change', leave);
    precise.addEventListener('change', leave);
    return () => {
      cancelAnimationFrame(frame);
      target.removeEventListener('pointerenter', move);
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerleave', leave);
      reduced.removeEventListener('change', leave);
      precise.removeEventListener('change', leave);
    };
  }, []);
  return (
    <span ref={surface} className="liquid-glass-surface" aria-hidden="true">
      <span className="liquid-glass-reflection" />
      <span className="liquid-glass-edge" />
    </span>
  );
}
