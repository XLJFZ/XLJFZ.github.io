'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { PortfolioImage } from '@/lib/portfolio';
import { cn } from '@/lib/utils';

type GalleryItem = { image: PortfolioImage; sourceIndex: number };

function imageOrientation(image: PortfolioImage) {
  return image.layout === 'portrait' || image.layout === 'medium' ? 'portrait' : 'landscape';
}

function buildGalleryRows(images: PortfolioImage[]) {
  const pending: GalleryItem[] = images.map((image, sourceIndex) => ({ image, sourceIndex }));
  const rows: GalleryItem[][] = [];

  while (pending.length > 0) {
    const first = pending.shift()!;
    if (first.image.layout === 'wide') {
      rows.push([first]);
      continue;
    }

    const orientation = imageOrientation(first.image);
    const partnerIndex = pending.findIndex(
      ({ image }) => image.layout !== 'wide' && imageOrientation(image) === orientation,
    );
    const row = [first];
    if (partnerIndex >= 0) row.push(pending.splice(partnerIndex, 1)[0]);
    rows.push(row);
  }

  return rows;
}

export function LightboxGallery({ images }: { images: PortfolioImage[] }) {
  const rows = buildGalleryRows(images);
  const displayedItems = rows.flat();
  const [active, setActive] = useState<number | null>(null);
  const prev = () => setActive((value) => value === null ? null : (value - 1 + displayedItems.length) % displayedItems.length);
  const next = () => setActive((value) => value === null ? null : (value + 1) % displayedItems.length);

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
      <div className="space-y-10 md:space-y-[clamp(3.5rem,7vw,8rem)]">
        {rows.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}-${row[0].image.src}`}
            className={cn(
              'grid grid-cols-1 items-start gap-y-10',
              row.length === 2 && 'md:grid-cols-2 md:gap-x-[clamp(1.5rem,3vw,3.75rem)]',
            )}
          >
            {row.map(({ image, sourceIndex }, columnIndex) => {
              const displayIndex = displayedItems.findIndex((item) => item.sourceIndex === sourceIndex);
              const isUnpaired = row.length === 1 && image.layout !== 'wide';
              return (
                <figure
                  key={`${image.src}-${sourceIndex}`}
                  className={cn(
                    'w-full min-w-0',
                    image.layout === 'portrait' && !isUnpaired && 'md:w-[84%]',
                    image.layout === 'medium' && !isUnpaired && 'md:w-[88%]',
                    row.length === 2 && columnIndex === 1 && 'md:justify-self-end',
                    isUnpaired && imageOrientation(image) === 'portrait' && 'md:w-[42%]',
                    isUnpaired && imageOrientation(image) === 'landscape' && 'md:w-[calc(50%-clamp(0.75rem,1.5vw,1.875rem))]',
                    isUnpaired && rowIndex % 2 === 1 && 'md:justify-self-end',
                  )}
                >
                  <button onClick={() => setActive(displayIndex)} className="group block w-full overflow-hidden bg-[#292824] shadow-[0_18px_55px_rgba(0,0,0,.26)]" aria-label={`放大查看：${image.alt}`}>
                    <img src={image.src} alt={image.alt} loading={displayIndex > 1 ? 'lazy' : 'eager'} className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.008]" />
                  </button>
                  {image.caption && <figcaption className="pt-3 text-[10px] tracking-[0.16em] text-foreground/45 md:pt-4">{image.caption}</figcaption>}
                </figure>
              );
            })}
          </div>
        ))}
      </div>
      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent showCloseButton={false} className="h-[100svh] max-h-none w-screen max-w-none border-0 bg-black p-0 text-white ring-0">
          <DialogTitle className="sr-only">大图浏览</DialogTitle>
          <DialogDescription className="sr-only">使用左右箭头切换照片</DialogDescription>
          {active !== null && <img src={displayedItems[active].image.src} alt={displayedItems[active].image.alt} className="h-full w-full object-contain p-3 md:p-10" />}
          <button onClick={() => setActive(null)} aria-label="关闭" className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-black/30 backdrop-blur md:right-7 md:top-7"><X /></button>
          <button onClick={prev} aria-label="上一张" className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/30 backdrop-blur md:left-7"><ChevronLeft /></button>
          <button onClick={next} aria-label="下一张" className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/30 backdrop-blur md:right-7"><ChevronRight /></button>
          {active !== null && displayedItems[active].image.caption && <p className="absolute bottom-4 left-4 text-[10px] tracking-[0.16em] text-white/65 md:left-7">{displayedItems[active].image.caption}</p>}
          {active !== null && <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.2em] text-white/65">{String(active + 1).padStart(2, '0')} / {String(displayedItems.length).padStart(2, '0')}</p>}
        </DialogContent>
      </Dialog>
    </>
  );
}
