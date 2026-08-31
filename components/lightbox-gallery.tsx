'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { PortfolioImage } from '@/lib/portfolio';
import { cn } from '@/lib/utils';

export function LightboxGallery({ images }: { images: PortfolioImage[] }) {
  const [active, setActive] = useState<number | null>(null);
  const prev = () => setActive((value) => value === null ? null : (value - 1 + images.length) % images.length);
  const next = () => setActive((value) => value === null ? null : (value + 1) % images.length);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (active === null) return;
      if (event.key === 'ArrowLeft') prev();
      if (event.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <>
      <div className="grid grid-cols-1 gap-y-10 md:grid-cols-2 md:items-start md:gap-x-[clamp(1.5rem,3vw,3.75rem)] md:gap-y-[clamp(3.5rem,7vw,8rem)]">
        {images.map((image, index) => (
          <figure
            key={`${image.src}-${index}`}
            className={cn(
              'w-full min-w-0',
              image.layout === 'wide' && 'md:col-span-2',
              image.layout === 'portrait' && 'md:w-[84%]',
              image.layout === 'medium' && 'md:w-[88%]',
              image.layout !== 'wide' && index % 2 === 1 && 'md:mt-[clamp(2rem,5vw,6rem)] md:justify-self-end',
            )}
          >
            <button onClick={() => setActive(index)} className="group block w-full overflow-hidden bg-neutral-200 shadow-[0_18px_55px_rgba(38,34,27,.06)]" aria-label={`放大查看：${image.alt}`}>
              <img src={image.src} alt={image.alt} loading={index > 1 ? 'lazy' : 'eager'} className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.008]" />
            </button>
            {image.caption && <figcaption className="pt-3 text-[10px] tracking-[0.16em] text-black/45 md:pt-4">{image.caption}</figcaption>}
          </figure>
        ))}
      </div>
      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent showCloseButton={false} className="h-[100svh] max-h-none w-screen max-w-none border-0 bg-black p-0 text-white ring-0">
          <DialogTitle className="sr-only">大图浏览</DialogTitle>
          <DialogDescription className="sr-only">使用左右箭头切换照片</DialogDescription>
          {active !== null && <img src={images[active].src} alt={images[active].alt} className="h-full w-full object-contain p-3 md:p-10" />}
          <button onClick={() => setActive(null)} aria-label="关闭" className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-black/30 backdrop-blur md:right-7 md:top-7"><X /></button>
          <button onClick={prev} aria-label="上一张" className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/30 backdrop-blur md:left-7"><ChevronLeft /></button>
          <button onClick={next} aria-label="下一张" className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/30 backdrop-blur md:right-7"><ChevronRight /></button>
          {active !== null && images[active].caption && <p className="absolute bottom-4 left-4 text-[10px] tracking-[0.16em] text-white/65 md:left-7">{images[active].caption}</p>}
          {active !== null && <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.2em] text-white/65">{String(active + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}</p>}
        </DialogContent>
      </Dialog>
    </>
  );
}
