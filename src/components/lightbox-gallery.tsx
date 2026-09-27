'use client';

import type { CSSProperties } from 'react';
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Check, ChevronLeft, ChevronRight, Link2, X } from 'lucide-react';
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
import { galleryMaxWidth, type PortfolioImage } from '@/lib/portfolio';
import { previewWidths } from '@/lib/preview-policy.mjs';
import { cn } from '@/lib/utils';

type GalleryItem = { image: PortfolioImage; sourceIndex: number };
type GallerySection = { label?: string; rows: GalleryItem[][] };
type PreviewPreload = {
  image: HTMLImageElement;
  ready: Promise<void>;
};

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

function galleryPreviewSrc(image: PortfolioImage, width = 1200) {
  return image.src.replace(
    /-\d+\.jpg$/,
    `-${Math.min(width, galleryMaxWidth(image))}.jpg`,
  );
}

// Maximum tier uses the shared long-edge policy.
function galleryMaxSrc(image: PortfolioImage) {
  return galleryPreviewSrc(image, galleryMaxWidth(image));
}

function imageKey(src: string) {
  return (
    src
      .split('/')
      .pop()
      ?.replace(/-\d+\.jpg$/, '') ?? src
  );
}

function exifSummary(image: PortfolioImage) {
  if (!image.exif) return null;
  const values = [
    image.exif.camera,
    image.exif.focalLength,
    image.exif.aperture,
    image.exif.shutterSpeed,
    image.exif.iso,
  ].filter(Boolean);
  return values.length > 0 ? values.join(' · ') : null;
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
  const [loadedPreview, setLoadedPreview] = useState<string | null>(null);
  const [loadedOriginal, setLoadedOriginal] = useState<string | null>(null);
  const [failedOriginal, setFailedOriginal] = useState<string | null>(null);
  const [originalRequest, setOriginalRequest] = useState<string | null>(null);
  const {
    message: copyStatus,
    showStatus,
    dismissStatus,
  } = useTemporaryStatus();
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const suppressBackdropClick = useRef(false);
  const previewPreloads = useRef(new Map<string, PreviewPreload>());
  const activeIndex = useRef<number | null>(null);
  const requestedIndex = useRef<number | null>(null);
  const navigationToken = useRef(0);

  const preloadLightboxPreview = useCallback(
    (image: PortfolioImage, priority: 'auto' | 'high' = 'auto') => {
      const src = galleryPreviewSrc(image, 1800);
      const cached = previewPreloads.current.get(src);
      if (cached) {
        cached.image.fetchPriority = priority;
        previewPreloads.current.delete(src);
        previewPreloads.current.set(src, cached);
        return cached.ready;
      }
      const preload = new window.Image();
      preload.decoding = 'async';
      preload.fetchPriority = priority;
      preload.src = src;
      const entry: PreviewPreload = {
        image: preload,
        // Navigation waits for decode, so React never swaps to an undecoded frame.
        ready: preload.decode().catch(() => undefined),
      };
      previewPreloads.current.set(src, entry);
      while (previewPreloads.current.size > 4) {
        const oldest = previewPreloads.current.keys().next().value;
        if (!oldest) break;
        previewPreloads.current.delete(oldest);
      }
      return entry.ready;
    },
    [],
  );

  const commitImage = useCallback(
    (index: number, historyMode: 'push' | 'replace') => {
      const url = new URL(window.location.href);
      url.searchParams.set('image', imageKey(displayedItems[index].image.src));
      const currentState =
        window.history.state && typeof window.history.state === 'object'
          ? window.history.state
          : {};
      const nextState = {
        ...currentState,
        portfolioLightbox:
          historyMode === 'push' || currentState.portfolioLightbox === true,
      };
      if (historyMode === 'push') {
        window.history.pushState(nextState, '', url);
      } else {
        window.history.replaceState(nextState, '', url);
      }
      activeIndex.current = index;
      requestedIndex.current = index;
      startTransition(() => setActive(index));
    },
    [displayedItems],
  );

  const showImage = useCallback(
    (index: number, historyMode: 'push' | 'replace' = 'replace') => {
      requestedIndex.current = index;
      const token = ++navigationToken.current;
      if (activeIndex.current === null) {
        commitImage(index, historyMode);
        return;
      }
      void preloadLightboxPreview(displayedItems[index].image, 'high').then(
        () => {
          if (token !== navigationToken.current) return;
          commitImage(index, historyMode);
        },
      );
    },
    [commitImage, displayedItems, preloadLightboxPreview],
  );

  const closeLightbox = useCallback(() => {
    navigationToken.current += 1;
    activeIndex.current = null;
    requestedIndex.current = null;
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
    const current = requestedIndex.current ?? active;
    showImage((current - 1 + displayedItems.length) % displayedItems.length);
  }, [active, displayedItems.length, showImage]);
  const next = useCallback(() => {
    if (active === null) return;
    const current = requestedIndex.current ?? active;
    showImage((current + 1) % displayedItems.length);
  }, [active, displayedItems.length, showImage]);

  const copyCurrentImageLink = useCallback(async () => {
    if (active === null) return;
    const url = new URL(window.location.href);
    url.searchParams.set('image', imageKey(displayedItems[active].image.src));
    try {
      await navigator.clipboard.writeText(url.toString());
      showStatus(`作品链接已复制 · ${displayedItems[active].image.caption}`);
    } catch {
      showStatus(
        '复制失败，请选中下方作品链接后手动复制。',
        'error',
        0,
        url.toString(),
      );
    }
  }, [active, displayedItems, showStatus]);

  useEffect(() => {
    const syncFromUrl = () => {
      const key = new URL(window.location.href).searchParams.get('image');
      if (!key) {
        navigationToken.current += 1;
        activeIndex.current = null;
        requestedIndex.current = null;
        setActive(null);
        return;
      }
      const index = displayedItems.findIndex(
        ({ image }) => imageKey(image.src) === key,
      );
      const nextIndex = index >= 0 ? index : null;
      activeIndex.current = nextIndex;
      requestedIndex.current = nextIndex;
      setActive(nextIndex);
    };
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [displayedItems]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (active === null) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        prev();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        next();
      }
    };
    // The dialog focus manager handles arrow keys during bubbling.
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [active, next, prev]);

  useEffect(() => {
    if (active === null || displayedItems.length < 2) return;
    for (const offset of [-1, 1]) {
      const index =
        (active + offset + displayedItems.length) % displayedItems.length;
      void preloadLightboxPreview(displayedItems[index].image);
    }
  }, [active, displayedItems, preloadLightboxPreview]);

  useEffect(() => {
    if (active === null) return;
    const src = displayedItems[active].image.src;
    let idleId: number | undefined;
    const settleTimer = window.setTimeout(() => {
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(() => setOriginalRequest(src), {
          timeout: 1200,
        });
      } else {
        setOriginalRequest(src);
      }
    }, 650);
    return () => {
      window.clearTimeout(settleTimer);
      if (idleId !== undefined && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
    };
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
    if (!(currentLink instanceof HTMLElement)) return;
    const track = currentLink.parentElement;
    if (!track) return;
    const linkBounds = currentLink.getBoundingClientRect();
    const trackBounds = track.getBoundingClientRect();
    if (
      linkBounds.left < trackBounds.left ||
      linkBounds.right > trackBounds.right
    ) {
      // Only move the chapter strip; scrollIntoView can also move the page.
      track.scrollBy({
        left:
          linkBounds.left -
          trackBounds.left -
          (trackBounds.width - linkBounds.width) / 2,
        behavior: 'instant',
      });
    }
  }, [activeChapter]);

  return (
    <>
      {hasChapters && (
        <nav
          aria-label="专题章节"
          className="gallery-chapter-nav sticky z-10 -mx-5 mb-16 border-y border-foreground/10 bg-background/90 px-5 py-0.5 backdrop-blur-md sm:-mx-8 sm:px-8 md:-mx-10 md:mb-24 md:px-10 lg:-mx-14 lg:px-14 xl:-mx-16 xl:px-16"
        >
          <div className="mx-auto flex max-w-[1480px] items-center gap-4 sm:gap-6">
            <span className="shrink-0 text-xs tracking-[.08em] text-foreground/65 tabular-nums">
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
                        'site-nav-link group flex min-h-11 shrink-0 items-center gap-2 text-xs tracking-[.08em] transition-colors hover:text-foreground',
                        activeChapter === sectionIndex
                          ? 'text-foreground'
                          : 'text-foreground/65',
                      )}
                    >
                      <span
                        className={cn(
                          'text-[11px] transition-colors group-hover:text-foreground/75',
                          activeChapter === sectionIndex
                            ? 'text-foreground/75'
                            : 'text-foreground/55',
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
              'gallery-chapter',
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
                <span className="text-xs tracking-[.1em] text-foreground/65">
                  {String(sectionIndex + 1).padStart(2, '0')}
                </span>
                <h2 className="text-sm font-normal tracking-[.08em] text-foreground/75">
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
                          onPointerEnter={() => preloadLightboxPreview(image)}
                          onPointerDown={() => preloadLightboxPreview(image)}
                          onFocus={() => preloadLightboxPreview(image)}
                          onClick={() => showImage(displayIndex, 'push')}
                          className="group block w-full cursor-zoom-in overflow-hidden bg-[#292824] shadow-[0_18px_55px_rgba(0,0,0,.22)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground/70"
                          aria-label={`放大查看：${image.alt}`}
                        >
                          <img
                            src={galleryPreviewSrc(image)}
                            srcSet={previewWidths(image)
                              .map(
                                (width) =>
                                  `${galleryPreviewSrc(image, width)} ${width}w`,
                              )
                              .join(', ')}
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
                          <figcaption className="flex items-baseline justify-between gap-4 pt-3 text-xs leading-6 tracking-[.05em] text-foreground/70 md:pt-4">
                            <span>{image.caption}</span>
                            <span
                              aria-label={`第 ${displayIndex + 1} 幅，共 ${displayedItems.length} 幅`}
                              className="shrink-0 text-xs tracking-[.08em] text-foreground/55"
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
          motion="fade"
          showCloseButton={false}
          overlayClassName="bg-black backdrop-blur-none"
          style={{
            display: 'block',
            width: '100vw',
            maxWidth: 'none',
            height: '100svh',
            maxHeight: 'none',
          }}
          onClick={(event) => {
            const target = event.target;
            if (
              target instanceof Element &&
              target.closest('[data-lightbox-interactive]')
            ) {
              return;
            }
            if (suppressBackdropClick.current) {
              suppressBackdropClick.current = false;
              return;
            }
            closeLightbox();
          }}
          onTouchStart={(event) => {
            const touch = event.changedTouches[0];
            touchStart.current = { x: touch.clientX, y: touch.clientY };
            suppressBackdropClick.current = false;
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
            suppressBackdropClick.current = true;
            if (deltaX > 0) prev();
            else next();
          }}
          className="touch-pan-y gap-0 overflow-hidden rounded-none border-0 bg-black p-0 text-white ring-0 sm:max-w-none"
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
                  ? '大图加载失败，当前显示高清预览'
                  : loadedOriginal === displayedItems[active].image.src
                    ? '大图加载完成'
                    : '正在加载大图'}
              </p>
              <img
                src={galleryPreviewSrc(displayedItems[active].image, 1800)}
                width={displayedItems[active].image.width}
                height={displayedItems[active].image.height}
                alt=""
                aria-hidden="true"
                decoding="async"
                fetchPriority="high"
                onLoad={(event) => {
                  const src = displayedItems[active].image.src;
                  void event.currentTarget
                    .decode()
                    .catch(() => undefined)
                    .then(() => setLoadedPreview(src));
                }}
                onError={() =>
                  setLoadedPreview(displayedItems[active].image.src)
                }
                data-lightbox-interactive
                className="absolute left-1/2 top-1/2 h-auto w-auto max-h-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 object-contain md:max-h-[calc(100%-5rem)] md:max-w-[calc(100%-5rem)]"
              />
              {loadedPreview === displayedItems[active].image.src &&
                originalRequest === displayedItems[active].image.src &&
                failedOriginal !== displayedItems[active].image.src && (
                  <img
                    key={displayedItems[active].image.src}
                    src={galleryMaxSrc(displayedItems[active].image)}
                    width={displayedItems[active].image.width}
                    height={displayedItems[active].image.height}
                    alt={displayedItems[active].image.alt}
                    decoding="async"
                    fetchPriority="low"
                    onLoad={(event) => {
                      const src = displayedItems[active].image.src;
                      void event.currentTarget
                        .decode()
                        .catch(() => undefined)
                        .then(() => {
                          if (activeIndex.current === active) {
                            setLoadedOriginal(src);
                          }
                        });
                    }}
                    onError={() =>
                      setFailedOriginal(displayedItems[active].image.src)
                    }
                    data-lightbox-interactive
                    className={cn(
                      'absolute left-1/2 top-1/2 h-auto w-auto max-h-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 object-contain transition-opacity duration-300 md:max-h-[calc(100%-5rem)] md:max-w-[calc(100%-5rem)]',
                      loadedOriginal === displayedItems[active].image.src
                        ? 'opacity-100'
                        : 'opacity-0',
                    )}
                  />
                )}
            </div>
          )}
          <button
            type="button"
            data-lightbox-interactive
            onClick={closeLightbox}
            aria-label="关闭"
            className="absolute right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] grid size-11 place-items-center rounded-full bg-black/30 backdrop-blur transition-colors hover:bg-black/55 md:right-7 md:top-7"
          >
            <X />
          </button>
          <button
            type="button"
            data-lightbox-interactive
            onClick={copyCurrentImageLink}
            aria-label="复制当前作品链接"
            className="absolute left-[max(1rem,env(safe-area-inset-left))] top-[max(1rem,env(safe-area-inset-top))] grid size-11 place-items-center rounded-full bg-black/30 backdrop-blur transition-colors hover:bg-black/55 md:left-7 md:top-7"
          >
            {copyStatus?.tone === 'default' && !copyStatus.leaving ? (
              <Check aria-hidden="true" />
            ) : (
              <Link2 aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            data-lightbox-interactive
            onClick={prev}
            aria-label="上一张"
            aria-keyshortcuts="ArrowLeft"
            className="absolute left-[max(.75rem,env(safe-area-inset-left))] top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/30 backdrop-blur transition-colors hover:bg-black/55 md:left-7"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            data-lightbox-interactive
            onClick={next}
            aria-label="下一张"
            aria-keyshortcuts="ArrowRight"
            className="absolute right-[max(.75rem,env(safe-area-inset-right))] top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/30 backdrop-blur transition-colors hover:bg-black/55 md:right-7"
          >
            <ChevronRight />
          </button>
          {active !== null && (
            <div className="pointer-events-none absolute inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] flex items-end justify-between gap-5 md:inset-x-7">
              <div className="min-w-0">
                <p className="text-xs leading-6 tracking-[.05em] text-white/80">
                  {displayedItems[active].image.caption}
                </p>
                {exifSummary(displayedItems[active].image) && (
                  <p className="mt-0.5 truncate text-[11px] leading-5 tracking-[.03em] text-white/65">
                    {exifSummary(displayedItems[active].image)}
                  </p>
                )}
              </div>
              <p
                aria-live="polite"
                className="shrink-0 text-xs tracking-[.08em] text-white/70"
              >
                {String(active + 1).padStart(2, '0')} /{' '}
                {String(displayedItems.length).padStart(2, '0')}
              </p>
            </div>
          )}
          <TemporaryStatus message={copyStatus} onDismiss={dismissStatus} />
        </DialogContent>
      </Dialog>
    </>
  );
}
