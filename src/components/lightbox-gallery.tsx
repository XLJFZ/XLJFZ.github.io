'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import type { PortfolioImage } from '@/lib/portfolio';
import { cn } from '@/lib/utils';

type GalleryItem = { image: PortfolioImage; sourceIndex: number };
type GallerySection = { label?: string; rows: GalleryItem[][] };

function imageOrientation(image: PortfolioImage) {
  return image.height >= image.width ? 'portrait' : 'landscape';
}

function buildGalleryRows(items: GalleryItem[]) {
  const pending = [...items];
  const rows: GalleryItem[][] = [];

  while (pending.length > 0) {
    const first = pending.shift()!;
    if (first.image.layout === 'wide') {
      rows.push([first]);
      continue;
    }

    const orientation = imageOrientation(first.image);
    const partnerIndex = pending.findIndex(
      ({ image }) =>
        image.layout !== 'wide' && imageOrientation(image) === orientation,
    );
    const row = [first];
    if (partnerIndex >= 0) row.push(pending.splice(partnerIndex, 1)[0]);
    rows.push(row);
  }

  return rows;
}

function buildGallerySections(images: PortfolioImage[]): GallerySection[] {
  const groups: Array<{ label?: string; items: GalleryItem[] }> = [];

  images.forEach((image, sourceIndex) => {
    if (groups.length === 0 || image.chapter) {
      groups.push({ label: image.chapter, items: [] });
    }
    groups[groups.length - 1].items.push({ image, sourceIndex });
  });

  return groups.map(({ label, items }) => ({
    label,
    rows: buildGalleryRows(items),
  }));
}

export function LightboxGallery({ images }: { images: PortfolioImage[] }) {
  const sections = useMemo(() => buildGallerySections(images), [images]);
  const displayedItems = useMemo(
    () => sections.flatMap(({ rows }) => rows.flat()),
    [sections],
  );
  const [active, setActive] = useState<number | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const prev = useCallback(
    () =>
      setActive((value) =>
        value === null
          ? null
          : (value - 1 + displayedItems.length) % displayedItems.length,
      ),
    [displayedItems.length],
  );
  const next = useCallback(
    () =>
      setActive((value) =>
        value === null ? null : (value + 1) % displayedItems.length,
      ),
    [displayedItems.length],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (active === null) return;
      if (event.key === 'ArrowLeft') prev();
      if (event.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, next, prev]);

  useEffect(() => {
    if (active === null || displayedItems.length < 2) return;
    for (const offset of [-1, 1]) {
      const index =
        (active + offset + displayedItems.length) % displayedItems.length;
      const preload = new window.Image();
      preload.src = displayedItems[index].image.src;
    }
  }, [active, displayedItems]);

  return (
    <>
      <div className="space-y-20 md:space-y-32">
        {sections.map((section, sectionIndex) => (
          <section key={section.label ?? `gallery-${sectionIndex}`}>
            {section.label && (
              <div className="mb-8 flex items-center gap-4 border-t border-foreground/10 pt-4 md:mb-12">
                <span className="text-[10px] tracking-[0.2em] text-foreground/35">
                  {String(sectionIndex + 1).padStart(2, '0')}
                </span>
                <h2 className="text-xs font-normal tracking-[0.18em] text-foreground/58">
                  {section.label}
                </h2>
              </div>
            )}
            <div className="space-y-10 md:space-y-[clamp(3.5rem,7vw,8rem)]">
              {section.rows.map((row, rowIndex) => (
                <div
                  key={`row-${rowIndex}-${row[0].image.src}`}
                  className={cn(
                    'grid grid-cols-1 items-start gap-y-10',
                    row.length === 2 &&
                      'md:grid-cols-2 md:gap-x-[clamp(1.5rem,3vw,3.75rem)]',
                  )}
                >
                  {row.map(({ image, sourceIndex }, columnIndex) => {
                    const displayIndex = displayedItems.findIndex(
                      (item) => item.sourceIndex === sourceIndex,
                    );
                    const isUnpaired =
                      row.length === 1 && image.layout !== 'wide';
                    return (
                      <figure
                        key={`${image.src}-${sourceIndex}`}
                        className={cn(
                          'w-full min-w-0',
                          image.layout === 'portrait' &&
                            !isUnpaired &&
                            'md:w-[84%]',
                          image.layout === 'medium' &&
                            !isUnpaired &&
                            'md:w-[88%]',
                          row.length === 2 &&
                            columnIndex === 1 &&
                            'md:justify-self-end',
                          isUnpaired &&
                            imageOrientation(image) === 'portrait' &&
                            'md:w-[42%]',
                          isUnpaired &&
                            imageOrientation(image) === 'landscape' &&
                            'md:w-[calc(50%-clamp(0.75rem,1.5vw,1.875rem))]',
                          isUnpaired &&
                            rowIndex % 2 === 1 &&
                            'md:justify-self-end',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setActive(displayIndex)}
                          className="group block w-full overflow-hidden bg-[#292824] shadow-[0_18px_55px_rgba(0,0,0,.22)]"
                          aria-label={`放大查看：${image.alt}`}
                        >
                          <img
                            src={image.src}
                            width={image.width}
                            height={image.height}
                            alt={image.alt}
                            loading={displayIndex > 1 ? 'lazy' : 'eager'}
                            decoding="async"
                            className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.008]"
                          />
                        </button>
                        {image.caption && (
                          <figcaption className="pt-3 text-[11px] leading-5 tracking-[0.13em] text-foreground/58 md:pt-4">
                            {image.caption}
                          </figcaption>
                        )}
                      </figure>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <Dialog
        open={active !== null}
        onOpenChange={(open) => !open && setActive(null)}
      >
        <DialogContent
          showCloseButton={false}
          onTouchStart={(event) => {
            const touch = event.changedTouches[0];
            touchStart.current = { x: touch.clientX, y: touch.clientY };
          }}
          onTouchEnd={(event) => {
            if (!touchStart.current) return;
            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - touchStart.current.x;
            const deltaY = touch.clientY - touchStart.current.y;
            touchStart.current = null;
            if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY)) {
              return;
            }
            if (deltaX > 0) prev();
            else next();
          }}
          className="h-[100svh] max-h-none w-screen max-w-none touch-pan-y border-0 bg-black p-0 text-white ring-0"
        >
          <DialogTitle className="sr-only">大图浏览</DialogTitle>
          <DialogDescription className="sr-only">
            使用左右箭头或左右滑动切换照片
          </DialogDescription>
          {active !== null && (
            <img
              src={displayedItems[active].image.src}
              width={displayedItems[active].image.width}
              height={displayedItems[active].image.height}
              alt={displayedItems[active].image.alt}
              decoding="async"
              className="h-full w-full object-contain p-3 md:p-10"
            />
          )}
          <button
            type="button"
            onClick={() => setActive(null)}
            aria-label="关闭"
            className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-black/30 backdrop-blur md:right-7 md:top-7"
          >
            <X />
          </button>
          <button
            type="button"
            onClick={prev}
            aria-label="上一张"
            className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/30 backdrop-blur md:left-7"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="下一张"
            className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/30 backdrop-blur md:right-7"
          >
            <ChevronRight />
          </button>
          {active !== null && displayedItems[active].image.caption && (
            <p className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 text-[11px] tracking-[0.13em] text-white/70 md:left-7">
              {displayedItems[active].image.caption}
            </p>
          )}
          {active !== null && (
            <p
              aria-live="polite"
              className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 text-[10px] tracking-[0.2em] text-white/65"
            >
              {String(active + 1).padStart(2, '0')} /{' '}
              {String(displayedItems.length).padStart(2, '0')}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
