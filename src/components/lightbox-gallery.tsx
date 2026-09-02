'use client';

import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Link2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  TemporaryStatus,
  useTemporaryStatus,
} from '@/components/temporary-status';
import type { PortfolioImage } from '@/lib/portfolio';
import { cn } from '@/lib/utils';

type GalleryItem = { image: PortfolioImage; sourceIndex: number };
type GallerySection = { label?: string; rows: GalleryItem[][] };

function imageOrientation(image: PortfolioImage) {
  return image.height >= image.width ? 'portrait' : 'landscape';
}

function preferredPairedWidth(image: PortfolioImage) {
  if (image.layout === 'portrait') return 0.84;
  if (image.layout === 'medium') return 0.88;
  return 1;
}

function pairedWidth(row: GalleryItem[], itemIndex: number) {
  const equalHeight = Math.min(
    ...row.map(
      ({ image }) => (preferredPairedWidth(image) * image.height) / image.width,
    ),
  );
  const image = row[itemIndex].image;
  return `${((equalHeight * image.width * 100) / image.height).toFixed(4)}%`;
}

function galleryPreviewSrc(src: string, width = 1200) {
  if (!src.startsWith('/portfolio/')) return src;
  return src
    .replace('/portfolio/', '/portfolio-previews/')
    .replace(/\.[^.]+$/, `-${width}.jpg`);
}

function imageKey(src: string) {
  return (
    src
      .split('/')
      .pop()
      ?.replace(/\.[^.]+$/, '') ?? src
  );
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
    let partnerIndex = pending.findIndex(
      ({ image }) =>
        image.layout !== 'wide' && imageOrientation(image) === orientation,
    );
    if (partnerIndex < 0) {
      partnerIndex = pending.findIndex(({ image }) => image.layout !== 'wide');
    }
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
  const hasChapters = sections.some((section) => section.label);
  const displayedItems = useMemo(
    () => sections.flatMap(({ rows }) => rows.flat()),
    [sections],
  );
  const [activeChapter, setActiveChapter] = useState(0);
  const [hasUsedChapterAnchor, setHasUsedChapterAnchor] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [loadedOriginal, setLoadedOriginal] = useState<string | null>(null);
  const [failedOriginal, setFailedOriginal] = useState<string | null>(null);
  const { message: copyStatus, showStatus } = useTemporaryStatus();
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const showImage = useCallback(
    (index: number, historyMode: 'push' | 'replace' = 'replace') => {
      const url = new URL(window.location.href);
      url.searchParams.set('image', imageKey(displayedItems[index].image.src));
      const currentState =
        window.history.state && typeof window.history.state === 'object'
          ? window.history.state
          : {};
      const nextState = { ...currentState, portfolioLightbox: true };
      if (historyMode === 'push') {
        window.history.pushState(nextState, '', url);
      } else {
        window.history.replaceState(nextState, '', url);
      }
      setActive(index);
    },
    [displayedItems],
  );

  const closeLightbox = useCallback(() => {
    if (window.history.state?.portfolioLightbox) {
      window.history.back();
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('image');
    window.history.replaceState(window.history.state, '', url);
    setActive(null);
  }, []);

  const prev = useCallback(() => {
    if (active === null) return;
    showImage((active - 1 + displayedItems.length) % displayedItems.length);
  }, [active, displayedItems.length, showImage]);
  const next = useCallback(() => {
    if (active === null) return;
    showImage((active + 1) % displayedItems.length);
  }, [active, displayedItems.length, showImage]);

  const copyCurrentImageLink = useCallback(async () => {
    if (active === null) return;
    const url = new URL(window.location.href);
    url.searchParams.set('image', imageKey(displayedItems[active].image.src));
    try {
      await navigator.clipboard.writeText(url.toString());
      showStatus(`作品链接已复制 · ${displayedItems[active].image.caption}`);
    } catch {
      showStatus('复制失败，请从浏览器地址栏复制当前链接。', 'error', 4000);
    }
  }, [active, displayedItems, showStatus]);

  useEffect(() => {
    const syncFromUrl = () => {
      const key = new URL(window.location.href).searchParams.get('image');
      if (!key) {
        setActive(null);
        return;
      }
      const index = displayedItems.findIndex(
        ({ image }) => imageKey(image.src) === key,
      );
      setActive(index >= 0 ? index : null);
    };
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [displayedItems]);

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

  useEffect(() => {
    if (!hasChapters) return;
    let settleTimer: number | undefined;
    let finalSettleTimer: number | undefined;
    const syncChapterFromHash = () => {
      const match = window.location.hash.match(/^#chapter-(\d+)$/);
      if (!match) return;
      const chapterIndex = Number(match[1]) - 1;
      if (chapterIndex >= 0 && chapterIndex < sections.length) {
        setHasUsedChapterAnchor(true);
        setActiveChapter(chapterIndex);
        const alignChapter = () => {
          setActiveChapter(chapterIndex);
          document
            .getElementById(`chapter-${chapterIndex + 1}`)
            ?.scrollIntoView({ block: 'start' });
        };
        window.requestAnimationFrame(alignChapter);
        window.clearTimeout(settleTimer);
        window.clearTimeout(finalSettleTimer);
        settleTimer = window.setTimeout(alignChapter, 350);
        finalSettleTimer = window.setTimeout(alignChapter, 1000);
      }
    };
    syncChapterFromHash();
    window.addEventListener('hashchange', syncChapterFromHash);
    return () => {
      window.clearTimeout(settleTimer);
      window.clearTimeout(finalSettleTimer);
      window.removeEventListener('hashchange', syncChapterFromHash);
    };
  }, [hasChapters, sections.length]);

  useEffect(() => {
    if (!hasChapters) return;
    const chapterMarkers = document.querySelectorAll<HTMLElement>(
      '[data-chapter-marker]',
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries.find((entry) => entry.isIntersecting);
        if (!(current?.target instanceof HTMLElement)) return;
        setActiveChapter(Number(current.target.dataset.chapterIndex));
      },
      { rootMargin: '-20% 0px -75% 0px' },
    );
    chapterMarkers.forEach((marker) => observer.observe(marker));
    return () => observer.disconnect();
  }, [hasChapters]);

  useEffect(() => {
    const currentLink = document.querySelector(
      'nav[aria-label="专题章节"] [aria-current="location"]',
    );
    currentLink?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [activeChapter]);

  return (
    <>
      {hasChapters && (
        <nav
          aria-label="专题章节"
          className="sticky top-0 z-10 -mx-5 mb-16 border-y border-foreground/10 bg-background/90 px-5 py-3 backdrop-blur-md sm:-mx-8 sm:px-8 md:-mx-10 md:mb-24 md:px-10 lg:-mx-14 lg:px-14 xl:-mx-16 xl:px-16"
        >
          <div className="mx-auto flex max-w-[1480px] items-center gap-4 sm:gap-6">
            <span className="shrink-0 text-[9px] tracking-[0.18em] text-foreground/38 tabular-nums">
              章节 {String(activeChapter + 1).padStart(2, '0')}/
              {String(sections.length).padStart(2, '0')}
            </span>
            <div className="flex min-w-0 gap-4 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-6 md:gap-8">
              {sections.map(
                (section, sectionIndex) =>
                  section.label && (
                    <a
                      key={section.label}
                      href={`#chapter-${sectionIndex + 1}`}
                      aria-label={`第 ${sectionIndex + 1} 章，共 ${sections.length} 章：${section.label}`}
                      aria-current={
                        activeChapter === sectionIndex ? 'location' : undefined
                      }
                      onClick={() => setActiveChapter(sectionIndex)}
                      className={cn(
                        'group flex shrink-0 items-baseline gap-2 py-1 text-[10px] tracking-[0.14em] transition-colors hover:text-foreground',
                        activeChapter === sectionIndex
                          ? 'text-foreground'
                          : 'text-foreground/45',
                      )}
                    >
                      <span
                        className={cn(
                          'text-[8px] transition-colors group-hover:text-foreground/45',
                          activeChapter === sectionIndex
                            ? 'text-foreground/55'
                            : 'text-foreground/25',
                        )}
                      >
                        {String(sectionIndex + 1).padStart(2, '0')}
                      </span>
                      {section.label}
                    </a>
                  ),
              )}
            </div>
          </div>
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-px origin-left bg-foreground/35 transition-transform duration-500 ease-out"
            style={{
              transform: `scaleX(${(activeChapter + 1) / sections.length})`,
            }}
          />
        </nav>
      )}
      <div className="space-y-20 md:space-y-32">
        {sections.map((section, sectionIndex) => (
          <section
            key={section.label ?? `gallery-${sectionIndex}`}
            id={section.label ? `chapter-${sectionIndex + 1}` : undefined}
            data-chapter-index={section.label ? sectionIndex : undefined}
            className={cn(
              'scroll-mt-20',
              sectionIndex > 0 &&
                !hasUsedChapterAnchor &&
                'gallery-chapter-deferred',
            )}
          >
            {section.label && (
              <div
                data-chapter-marker
                data-chapter-index={sectionIndex}
                className="mb-8 flex items-center gap-4 border-t border-foreground/10 pt-4 md:mb-12"
              >
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
                        style={
                          row.length === 2
                            ? ({
                                '--gallery-paired-width': pairedWidth(
                                  row,
                                  columnIndex,
                                ),
                              } as CSSProperties)
                            : undefined
                        }
                        className={cn(
                          'w-full min-w-0',
                          row.length === 2 &&
                            'md:w-[var(--gallery-paired-width)]',
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
                          onClick={() => showImage(displayIndex, 'push')}
                          className="group block w-full cursor-zoom-in overflow-hidden bg-[#292824] shadow-[0_18px_55px_rgba(0,0,0,.22)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground/70"
                          aria-label={`放大查看：${image.alt}`}
                        >
                          <img
                            src={galleryPreviewSrc(image.src)}
                            srcSet={`${galleryPreviewSrc(image.src)} 1200w, ${galleryPreviewSrc(image.src, 1800)} 1800w, ${image.src} ${image.width}w`}
                            sizes={
                              image.layout === 'wide'
                                ? '(min-width: 1536px) 1352px, (min-width: 768px) calc(100vw - 8rem), calc(100vw - 40px)'
                                : '(min-width: 1536px) 620px, (min-width: 768px) 44vw, calc(100vw - 40px)'
                            }
                            width={image.width}
                            height={image.height}
                            alt={image.alt}
                            loading={displayIndex === 0 ? 'eager' : 'lazy'}
                            fetchPriority={displayIndex === 0 ? 'high' : 'auto'}
                            decoding="async"
                            className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.008] group-focus-visible:scale-[1.008]"
                          />
                        </button>
                        {image.caption && (
                          <figcaption className="flex items-baseline justify-between gap-4 pt-3 text-[11px] leading-5 tracking-[0.13em] text-foreground/58 md:pt-4">
                            <span>{image.caption}</span>
                            <span
                              aria-label={`第 ${displayIndex + 1} 幅，共 ${displayedItems.length} 幅`}
                              className="shrink-0 text-[9px] tracking-[0.18em] text-foreground/28"
                            >
                              {String(displayIndex + 1).padStart(2, '0')} /{' '}
                              {String(displayedItems.length).padStart(2, '0')}
                            </span>
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
        onOpenChange={(open) => !open && closeLightbox()}
      >
        <DialogContent
          showCloseButton={false}
          style={{
            display: 'block',
            width: 'calc(100vw - 1.5rem)',
            maxWidth: 'none',
            height: 'calc(100svh - 1.5rem)',
            maxHeight: 'none',
          }}
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
          className="touch-pan-y gap-0 overflow-hidden border-0 bg-black p-0 text-white ring-0 sm:max-w-none"
        >
          <DialogTitle className="sr-only">大图浏览</DialogTitle>
          <DialogDescription className="sr-only">
            使用左右箭头键或左右滑动切换照片，左上角按钮可复制当前作品链接
          </DialogDescription>
          {active !== null && (
            <div
              className="relative h-full w-full"
              aria-busy={
                loadedOriginal !== displayedItems[active].image.src &&
                failedOriginal !== displayedItems[active].image.src
              }
            >
              <p className="sr-only" aria-live="polite">
                {failedOriginal === displayedItems[active].image.src
                  ? '原图加载失败，当前显示高清预览'
                  : loadedOriginal === displayedItems[active].image.src
                    ? '原图加载完成'
                    : '正在加载原图'}
              </p>
              <img
                src={galleryPreviewSrc(displayedItems[active].image.src, 1800)}
                width={displayedItems[active].image.width}
                height={displayedItems[active].image.height}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-contain p-3 md:p-10"
              />
              <img
                key={displayedItems[active].image.src}
                src={displayedItems[active].image.src}
                width={displayedItems[active].image.width}
                height={displayedItems[active].image.height}
                alt={displayedItems[active].image.alt}
                decoding="async"
                fetchPriority="high"
                onLoad={() =>
                  setLoadedOriginal(displayedItems[active].image.src)
                }
                onError={() =>
                  setFailedOriginal(displayedItems[active].image.src)
                }
                className={cn(
                  'absolute inset-0 h-full w-full object-contain p-3 transition-opacity duration-300 md:p-10',
                  loadedOriginal === displayedItems[active].image.src
                    ? 'opacity-100'
                    : 'opacity-0',
                )}
              />
            </div>
          )}
          <button
            type="button"
            onClick={closeLightbox}
            aria-label="关闭"
            className="absolute right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] grid size-11 place-items-center rounded-full bg-black/30 backdrop-blur transition-colors hover:bg-black/55 md:right-7 md:top-7"
          >
            <X />
          </button>
          <button
            type="button"
            onClick={copyCurrentImageLink}
            aria-label="复制当前作品链接"
            className="absolute left-[max(1rem,env(safe-area-inset-left))] top-[max(1rem,env(safe-area-inset-top))] grid size-11 place-items-center rounded-full bg-black/30 backdrop-blur transition-colors hover:bg-black/55 md:left-7 md:top-7"
          >
            <Link2 />
          </button>
          <button
            type="button"
            onClick={prev}
            aria-label="上一张"
            aria-keyshortcuts="ArrowLeft"
            className="absolute left-[max(.75rem,env(safe-area-inset-left))] top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/30 backdrop-blur transition-colors hover:bg-black/55 md:left-7"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="下一张"
            aria-keyshortcuts="ArrowRight"
            className="absolute right-[max(.75rem,env(safe-area-inset-right))] top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/30 backdrop-blur transition-colors hover:bg-black/55 md:right-7"
          >
            <ChevronRight />
          </button>
          {active !== null && (
            <div className="pointer-events-none absolute inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] flex items-end justify-between gap-5 md:inset-x-7">
              <p className="min-w-0 text-[11px] leading-5 tracking-[0.13em] text-white/70">
                {displayedItems[active].image.caption}
              </p>
              <p
                aria-live="polite"
                className="shrink-0 text-[10px] tracking-[0.2em] text-white/65"
              >
                {String(active + 1).padStart(2, '0')} /{' '}
                {String(displayedItems.length).padStart(2, '0')}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <TemporaryStatus message={copyStatus} />
    </>
  );
}
